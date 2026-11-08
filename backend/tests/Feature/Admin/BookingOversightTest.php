<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::factory()->admin()->create();
    Sanctum::actingAs($this->admin);
});

it('lists every booking with both parties, filtered by status, type and reference', function (): void {
    $searching = Booking::factory()->status(BookingStatus::Searching)->create();
    Booking::factory()->pabili()->status(BookingStatus::Completed)->create(['rider_id' => User::factory()->rider()]);

    $this->getJson('/api/v1/admin/bookings')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.1.customer.phone', $searching->customer->phone)
        ->assertJsonPath('data.0.rider.name', fn (?string $name) => $name !== null);

    $this->getJson('/api/v1/admin/bookings?status=searching')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/admin/bookings?service_type=pabili')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/admin/bookings?search='.strtolower(substr($searching->reference, 3, 4)))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $searching->id);
});

it('shows any booking with its history', function (): void {
    $booking = Booking::factory()->create();
    $booking->statusLogs()->create(['from_status' => null, 'to_status' => 'pending', 'actor_id' => $booking->customer_id]);

    $this->getJson("/api/v1/admin/bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.reference', $booking->reference)
        ->assertJsonCount(1, 'data.status_logs');
});

it('lets support cancel a booking the customer no longer can, with a mandatory reason', function (): void {
    $rider = User::factory()->rider()->create();
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => $rider->id]);

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/cancel", ['reason' => ''])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['reason']]);

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/cancel", ['reason' => 'Rider had an accident'])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled')
        ->assertJsonPath('data.cancellation_reason', 'Rider had an accident')
        ->assertJsonPath('data.status_logs.0.reason', 'Rider had an accident');

    expect($booking->statusLogs()->sole()->actor_id)->toBe($this->admin->id);
});

it('can cancel a completed booking (a dispute) but not one already cancelled', function (): void {
    $completed = Booking::factory()->status(BookingStatus::Completed)->create();
    $cancelled = Booking::factory()->status(BookingStatus::Cancelled)->create();

    $this->postJson("/api/v1/admin/bookings/{$completed->id}/cancel", ['reason' => 'Customer never received the order'])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    $this->postJson("/api/v1/admin/bookings/{$cancelled->id}/cancel", ['reason' => 'Twice'])->assertStatus(409);
});

it('summarises the day on the dashboard', function (): void {
    Booking::factory()->status(BookingStatus::Searching)->create();
    Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => User::factory()->rider()]);
    Booking::factory()->status(BookingStatus::Completed)->create(['total_fare_centavos' => 5000]);
    Booking::factory()->status(BookingStatus::Completed)->create(['total_fare_centavos' => 7955]);
    $online = User::factory()->rider()->create();
    RiderProfile::forRider($online)->forceFill(['is_online' => true])->save();

    $this->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('data.bookings_today.searching', 1)
        ->assertJsonPath('data.bookings_today.completed', 2)
        ->assertJsonPath('data.bookings_today.cancelled', 0)
        ->assertJsonPath('data.bookings_in_progress', 1)
        ->assertJsonPath('data.bookings_searching', 1)
        ->assertJsonPath('data.riders_online', 1)
        ->assertJsonPath('data.riders_total', 2)
        ->assertJsonPath('data.revenue_today.centavos', 12955);
});

it('paginates with a capped page size and exposes the totals', function (): void {
    Booking::factory()->count(12)->create();

    $this->getJson('/api/v1/admin/bookings?per_page=5&page=2')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.current_page', 2)
        ->assertJsonPath('meta.per_page', 5)
        ->assertJsonPath('meta.total', 12)
        ->assertJsonPath('meta.last_page', 3);

    $this->getJson('/api/v1/admin/bookings?per_page=500')->assertUnprocessable();
    $this->getJson('/api/v1/admin/users?per_page=1')->assertUnprocessable();
});
