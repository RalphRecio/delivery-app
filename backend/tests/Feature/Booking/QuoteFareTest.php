<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use Database\Seeders\FareSettingSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->seed(FareSettingSeeder::class);
    Sanctum::actingAs(User::factory()->create());
});

/** SM City Cebu -> Ayala Center Cebu: ~1.5 km straight line, ~2 km by the road factor. */
function cebuTrip(): array
{
    return [
        'pickup' => ['latitude' => 10.3119, 'longitude' => 123.9180],
        'dropoff' => ['latitude' => 10.3181, 'longitude' => 123.9050],
    ];
}

it('quotes a pasuyo fare from the server-side tariff and distance', function (): void {
    $response = $this->postJson('/api/v1/customer/bookings/quote', ['service_type' => 'pasuyo', ...cebuTrip()])
        ->assertOk()
        ->assertJsonPath('data.service_type', 'pasuyo')
        ->assertJsonPath('data.fare.base_fare.centavos', 4900)
        ->assertJsonPath('data.fare.service_fee.centavos', 0)
        ->assertJsonPath('data.fare.total.currency', 'PHP');

    $distance = $response->json('data.fare.distance_meters');

    expect($distance)->toBeGreaterThan(1500)->toBeLessThan(2500);
});

it('adds the purchase handling fee for pabili and totals the parts', function (): void {
    $response = $this->postJson('/api/v1/customer/bookings/quote', ['service_type' => 'pabili', ...cebuTrip()])
        ->assertOk()
        ->assertJsonPath('data.fare.base_fare.centavos', 5900)
        ->assertJsonPath('data.fare.service_fee.centavos', 2000);

    $fare = $response->json('data.fare');

    expect($fare['total']['centavos'])->toBe(5900 + $fare['distance_fare']['centavos'] + 2000)
        ->and($fare['chargeable_meters'])->toBe(max(0, $fare['distance_meters'] - 2000));
});

it('quotes a pabili without a pickup at zero distance', function (): void {
    $response = $this->postJson('/api/v1/customer/bookings/quote', [
        'service_type' => 'pabili',
        'dropoff' => cebuTrip()['dropoff'],
    ])
        ->assertOk()
        ->assertJsonPath('data.fare.distance_meters', 0)
        ->assertJsonPath('data.fare.distance_fare.centavos', 0);

    $fare = $response->json('data.fare');

    expect($fare['total']['centavos'])->toBe(5900 + 2000);
});

it('still requires a pickup to quote a pasuyo', function (): void {
    $this->postJson('/api/v1/customer/bookings/quote', ['service_type' => 'pasuyo', 'dropoff' => cebuTrip()['dropoff']])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pickup']]);
});

it('validates the service type and coordinates', function (): void {
    $this->postJson('/api/v1/customer/bookings/quote', [
        'service_type' => 'teleport',
        'pickup' => ['latitude' => 95, 'longitude' => 123.9],
    ])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['service_type', 'pickup.latitude', 'dropoff']]);
});

it('answers 503 when the tariff is missing', function (): void {
    App\Domain\Booking\Models\FareSetting::query()->delete();

    $this->postJson('/api/v1/customer/bookings/quote', ['service_type' => 'pasuyo', ...cebuTrip()])
        ->assertStatus(503)
        ->assertJsonPath('message', 'Pasuyo is not available right now.');
});

it('is closed to riders', function (): void {
    Sanctum::actingAs(User::factory()->rider()->create());

    $this->postJson('/api/v1/customer/bookings/quote', ['service_type' => 'pasuyo', ...cebuTrip()])
        ->assertForbidden();
});
