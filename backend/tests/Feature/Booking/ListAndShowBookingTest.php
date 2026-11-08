<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;
use Laravel\Sanctum\Sanctum;

it('lists only the signed-in customer\'s bookings, newest first', function (): void {
    $me = User::factory()->create();
    $mine = Booking::factory()->count(2)->for($me, 'customer')->create();
    Booking::factory()->create();

    Sanctum::actingAs($me);

    $this->getJson('/api/v1/customer/bookings')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $mine->last()?->id)
        ->assertJsonPath('data.1.id', $mine->first()?->id)
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('success', true);
});

it('shows a booking with its status history', function (): void {
    $me = User::factory()->create();
    $booking = Booking::factory()->pabili()->for($me, 'customer')->create();
    $booking->statusLogs()->create(['from_status' => null, 'to_status' => 'pending', 'actor_id' => $me->id]);

    Sanctum::actingAs($me);

    $this->getJson("/api/v1/customer/bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.reference', $booking->reference)
        ->assertJsonPath('data.items.0.name', 'Bottled water 1L')
        ->assertJsonPath('data.dropoff.point.latitude', 10.3181)
        ->assertJsonCount(1, 'data.status_logs');
});

it('hides other customers\' bookings', function (): void {
    $booking = Booking::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/v1/customer/bookings/{$booking->id}")->assertForbidden();
    $this->postJson("/api/v1/customer/bookings/{$booking->id}/cancel")->assertForbidden();
});

it('answers 404 for an unknown booking', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/v1/customer/bookings/999999')->assertNotFound();
});
