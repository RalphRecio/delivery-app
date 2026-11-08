<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Events\BookingStatusChanged;
use App\Domain\Booking\Models\Booking;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->customer = User::factory()->create();
    Sanctum::actingAs($this->customer);
});

it('cancels a pending booking with a reason and logs it', function (): void {
    Event::fake([BookingStatusChanged::class]);
    $booking = Booking::factory()->for($this->customer, 'customer')->create();

    $this->postJson("/api/v1/customer/bookings/{$booking->id}/cancel", ['reason' => 'Changed my mind'])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled')
        ->assertJsonPath('data.can_cancel', false)
        ->assertJsonPath('data.cancellation_reason', 'Changed my mind')
        ->assertJsonPath('data.status_logs.0.from_status', 'pending')
        ->assertJsonPath('data.status_logs.0.to_status', 'cancelled')
        ->assertJsonPath('data.status_logs.0.reason', 'Changed my mind');

    expect($booking->refresh()->cancelled_at)->not->toBeNull();

    Event::assertDispatched(BookingStatusChanged::class, fn (BookingStatusChanged $event) => $event->from === BookingStatus::Pending && $event->to === BookingStatus::Cancelled);
});

it('refuses to cancel once the rider is on the way', function (BookingStatus $status): void {
    $booking = Booking::factory()->for($this->customer, 'customer')->status($status)->create();

    $this->postJson("/api/v1/customer/bookings/{$booking->id}/cancel")
        ->assertStatus(409)
        ->assertJsonPath('message', fn (string $message) => str_starts_with($message, 'This booking can no longer be cancelled.'));

    expect($booking->refresh()->status)->toBe($status);
})->with([
    BookingStatus::PickingUp,
    BookingStatus::InTransit,
    BookingStatus::Completed,
    BookingStatus::Cancelled,
]);
