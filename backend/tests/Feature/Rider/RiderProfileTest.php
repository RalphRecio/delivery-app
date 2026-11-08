<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->rider = User::factory()->rider()->create();
    Sanctum::actingAs($this->rider);
});

it('creates the profile on first read, offline and without a location', function (): void {
    $this->getJson('/api/v1/rider/profile')
        ->assertOk()
        ->assertJson(['data' => ['is_online' => false, 'current_location' => null, 'location_updated_at' => null]]);

    expect(RiderProfile::query()->where('user_id', $this->rider->id)->exists())->toBeTrue();
});

it('toggles availability', function (): void {
    $this->putJson('/api/v1/rider/availability', ['is_online' => true])
        ->assertOk()
        ->assertJsonPath('data.is_online', true);

    $this->putJson('/api/v1/rider/availability', ['is_online' => false])
        ->assertOk()
        ->assertJsonPath('data.is_online', false);
});

it('stores the latest location with a timestamp', function (): void {
    $this->putJson('/api/v1/rider/location', ['latitude' => 10.3119, 'longitude' => 123.918])
        ->assertOk()
        ->assertJsonPath('data.current_location.latitude', 10.3119)
        ->assertJsonPath('data.current_location.longitude', 123.918)
        ->assertJsonPath('data.location_updated_at', fn (?string $at) => $at !== null);

    $this->putJson('/api/v1/rider/location', ['latitude' => 95, 'longitude' => 123.918])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['latitude']]);
});

it('is closed to customers', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/v1/rider/profile')->assertForbidden();
});

it('records a heartbeat from the rider app', function (): void {
    $rider = User::factory()->rider()->create();
    Sanctum::actingAs($rider);

    $this->postJson('/api/v1/rider/heartbeat')
        ->assertOk()
        ->assertJsonPath('data.last_seen_at', fn ($value) => is_string($value));

    expect(RiderProfile::forRider($rider)->last_seen_at)->not->toBeNull();
});
