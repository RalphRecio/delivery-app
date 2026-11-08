<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use Laravel\Sanctum\Sanctum;

function onlineRider(): User
{
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill(['is_online' => true])->save();
    fundWallet($rider);
    Sanctum::actingAs($rider);

    return $rider;
}

it('assigns the job to the first rider who accepts and tells the customer', function (): void {
    $rider = onlineRider();
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")
        ->assertOk()
        ->assertJsonPath('data.status', 'accepted')
        ->assertJsonPath('data.rider', null)                    // riders get the customer, not themselves
        ->assertJsonPath('data.customer.id', $booking->customer_id)
        ->assertJsonPath('data.status_logs.0.from_status', 'searching')
        ->assertJsonPath('data.status_logs.0.to_status', 'accepted');

    expect($booking->refresh()->rider_id)->toBe($rider->id);

    Sanctum::actingAs($booking->customer);
    $this->getJson("/api/v1/customer/bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.status_label', 'Rider assigned')
        ->assertJsonPath('data.rider.name', $rider->name)
        ->assertJsonPath('data.rider.phone', $rider->phone);
});

it('gives the second rider a conflict instead of a duplicate assignment', function (): void {
    $first = onlineRider();
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")->assertOk();

    onlineRider();
    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")
        ->assertStatus(409)
        ->assertJsonPath('message', 'This job is no longer available.');

    expect($booking->refresh()->rider_id)->toBe($first->id)
        ->and($booking->statusLogs()->count())->toBe(1);
});

it('refuses a booking that is not searching', function (BookingStatus $status): void {
    onlineRider();
    $booking = Booking::factory()->status($status)->create();

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")->assertStatus(409);
})->with([BookingStatus::Pending, BookingStatus::Cancelled, BookingStatus::Completed]);

it('refuses an offline rider', function (): void {
    $rider = onlineRider();
    RiderProfile::forRider($rider)->forceFill(['is_online' => false])->save();
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Go online to see and accept jobs.');
});

it('allows one active job at a time', function (): void {
    $rider = onlineRider();
    $current = Booking::factory()->status(BookingStatus::PickingUp)->create(['rider_id' => $rider->id]);
    $next = Booking::factory()->status(BookingStatus::Searching)->create();

    $this->postJson("/api/v1/rider/jobs/{$next->id}/accept")
        ->assertStatus(409)
        ->assertJsonPath('message', "Finish your current job ({$current->reference}) before accepting another.");
});

it('is closed to customers', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")->assertForbidden();
});
