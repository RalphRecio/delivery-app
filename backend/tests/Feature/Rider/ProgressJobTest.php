<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->rider = User::factory()->rider()->create();
    Sanctum::actingAs($this->rider);
});

it('walks an accepted job to completion', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Accepted)->create(['rider_id' => $this->rider->id]);

    foreach (['picking_up', 'in_transit', 'completed'] as $status) {
        $this->postJson("/api/v1/rider/jobs/{$booking->id}/status", ['status' => $status])
            ->assertOk()
            ->assertJsonPath('data.status', $status);
    }

    expect($booking->refresh()->status)->toBe(BookingStatus::Completed)
        ->and($booking->statusLogs()->count())->toBe(3);

    $this->getJson('/api/v1/rider/jobs/active')->assertOk()->assertJsonPath('data', null);
});

it('reports the active job while one is in progress', function (): void {
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => $this->rider->id]);

    $this->getJson('/api/v1/rider/jobs/active')
        ->assertOk()
        ->assertJsonPath('data.id', $booking->id)
        ->assertJsonPath('data.customer.id', $booking->customer_id);
});

it('rejects skipping a step', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Accepted)->create(['rider_id' => $this->rider->id]);

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/status", ['status' => 'completed'])
        ->assertStatus(409)
        ->assertJsonPath('message', fn (string $m) => str_contains($m, 'cannot move from accepted to completed'));
});

it('does not let a rider cancel through the status endpoint', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Accepted)->create(['rider_id' => $this->rider->id]);

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/status", ['status' => 'cancelled'])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['status']]);
});

it('only lets the assigned rider progress or view a job', function (): void {
    $booking = Booking::factory()->status(BookingStatus::Accepted)->create(['rider_id' => User::factory()->rider()]);

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/status", ['status' => 'picking_up'])->assertForbidden();
    $this->getJson("/api/v1/rider/jobs/{$booking->id}")->assertForbidden();
});

it('lists the rider\'s job history, newest first', function (): void {
    $mine = Booking::factory()->count(2)->status(BookingStatus::Completed)->create(['rider_id' => $this->rider->id]);
    Booking::factory()->status(BookingStatus::Completed)->create(['rider_id' => User::factory()->rider()]);

    $this->getJson('/api/v1/rider/jobs')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $mine->last()?->id);
});
