<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Support\Facades\Date;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::factory()->admin()->create();
    Sanctum::actingAs($this->admin);
});

/** A rider with the app open: online, recent heartbeat, funded wallet. */
function onDutyRider(?GeoPoint $at = null, string $walletPesos = '500', int $secondsSinceSeen = 10): User
{
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill([
        'is_online' => true,
        'last_seen_at' => Date::now()->subSeconds($secondsSinceSeen),
        'current_location' => $at,
        'location_updated_at' => $at === null ? null : Date::now(),
    ])->save();

    if ($walletPesos !== '0') {
        fundWallet($rider, $walletPesos);
    }

    return $rider;
}

it('lists every active rider, available first, then on duty, then nearest', function (): void {
    // The factory pickup is at SM City Cebu (10.3119, 123.9180).
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $far = onDutyRider(new GeoPoint(10.3300, 123.9180));
    $near = onDutyRider(new GeoPoint(10.3125, 123.9180));
    $busy = onDutyRider(new GeoPoint(10.3119, 123.9180));
    Booking::factory()->status(BookingStatus::PickingUp)->create(['rider_id' => $busy->id, 'reference' => 'BK-BUSY0001']);
    $broke = onDutyRider(new GeoPoint(10.3120, 123.9180), walletPesos: '0');
    $stale = onDutyRider(new GeoPoint(10.3119, 123.9180), secondsSinceSeen: 600); // app closed
    $offline = onDutyRider();
    RiderProfile::forRider($offline)->forceFill(['is_online' => false])->save();
    $deactivated = onDutyRider();
    $deactivated->forceFill(['deactivated_at' => Date::now()])->save();

    $response = $this->getJson("/api/v1/admin/bookings/{$booking->id}/rider-candidates")
        ->assertOk()
        ->assertJsonCount(6, 'data');

    // Off-duty riders come after on-duty ones but before unavailable ones.
    expect(array_column(array_column($response->json('data'), 'rider'), 'id'))
        ->toBe([$near->id, $far->id, $stale->id, $offline->id, $busy->id, $broke->id]);

    $response
        ->assertJsonPath('data.0.is_on_duty', true)
        ->assertJsonPath('data.2.is_on_duty', false)
        ->assertJsonPath('data.2.is_available', true)
        ->assertJsonPath('data.3.is_on_duty', false)
        ->assertJsonPath('data.0.is_available', true)
        ->assertJsonPath('data.0.unavailable_reason', null)
        ->assertJsonPath('data.0.distance_to_pickup_meters', fn (int $meters) => $meters > 50 && $meters < 100)
        ->assertJsonPath('data.0.wallet_balance.centavos', 50000)
        ->assertJsonPath('data.4.is_available', false)
        ->assertJsonPath('data.4.unavailable_reason', 'On job BK-BUSY0001')
        ->assertJsonPath('data.5.unavailable_reason', 'Wallet ₱0.00 is below the ₱150.00 minimum');
});

it('assigns an available rider and starts the job at once', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $rider = onDutyRider(new GeoPoint(10.3125, 123.9180));

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $rider->id])
        ->assertOk()
        ->assertJsonPath('data.status', 'accepted')
        ->assertJsonPath('data.rider.id', $rider->id)
        ->assertJsonPath('data.status_logs.0.to_status', 'accepted')
        ->assertJsonPath('data.status_logs.0.reason', 'Assigned by dispatcher');

    expect($booking->refresh()->rider_id)->toBe($rider->id)
        ->and($booking->statusLogs()->first()?->actor_id)->toBe($this->admin->id);

    // The rider app finds it as the active job.
    Sanctum::actingAs($rider);
    $this->getJson('/api/v1/rider/jobs/active')->assertOk()->assertJsonPath('data.id', $booking->id);
});

it('assigns an off-duty rider, who finds the job when they open the app', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $rider = onDutyRider(secondsSinceSeen: 600);
    RiderProfile::forRider($rider)->forceFill(['is_online' => false])->save();

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $rider->id])
        ->assertOk()
        ->assertJsonPath('data.status', 'accepted')
        ->assertJsonPath('data.rider.id', $rider->id);

    Sanctum::actingAs($rider);
    $this->getJson('/api/v1/rider/jobs/active')->assertOk()->assertJsonPath('data.id', $booking->id);
});

it('assigns a rider who never opened the app', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $rider = User::factory()->rider()->create();
    fundWallet($rider, '500');

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $rider->id])
        ->assertOk()
        ->assertJsonPath('data.rider.id', $rider->id);
});

it('refuses riders who cannot take the job', function (Closure $makeRider, string $message): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $rider = $makeRider();

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $rider->id])
        ->assertStatus(409)
        ->assertJsonPath('message', fn (string $text) => str_contains($text, $message))
        ->assertJsonPath('errors.rider_id.0', fn (string $text) => str_contains($text, $message));

    expect($booking->refresh()->rider_id)->toBeNull()
        ->and($booking->status)->toBe(BookingStatus::Searching);
})->with([
    'a customer' => [fn () => User::factory()->create(), 'not an active rider'],
    'deactivated' => [function () {
        $rider = onDutyRider();
        $rider->forceFill(['deactivated_at' => Date::now()])->save();

        return $rider;
    }, 'not an active rider'],
    'on another job' => [function () {
        $rider = onDutyRider();
        Booking::factory()->status(BookingStatus::Accepted)->create(['rider_id' => $rider->id, 'reference' => 'BK-OTHER001']);

        return $rider;
    }, 'On job BK-OTHER001'],
    'low wallet' => [fn () => onDutyRider(walletPesos: '100'), 'below the ₱150.00 minimum'],
]);

it('refuses a booking that already has a rider or is no longer waiting', function (BookingStatus $status): void {
    $booking = Booking::factory()->status($status)->create();
    $rider = onDutyRider();

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $rider->id])
        ->assertStatus(409)
        ->assertJsonPath('message', 'This job is no longer available.');
})->with([BookingStatus::Pending, BookingStatus::Accepted, BookingStatus::Cancelled, BookingStatus::Completed]);

it('gives a rider who tries to accept a dispatched job a conflict', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $assigned = onDutyRider();
    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $assigned->id])->assertOk();

    Sanctum::actingAs(onDutyRider());
    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")
        ->assertStatus(409)
        ->assertJsonPath('message', 'This job is no longer available.');

    expect($booking->refresh()->rider_id)->toBe($assigned->id);
});

it('validates the rider id', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('rider_id');
});

it('is closed to customers and riders', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $rider = onDutyRider();

    foreach ([User::factory()->create(), $rider] as $user) {
        Sanctum::actingAs($user);
        $this->getJson("/api/v1/admin/bookings/{$booking->id}/rider-candidates")->assertForbidden();
        $this->postJson("/api/v1/admin/bookings/{$booking->id}/assign-rider", ['rider_id' => $rider->id])->assertForbidden();
    }
});
