<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\FareSetting;
use Database\Seeders\FareSettingSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->seed(FareSettingSeeder::class);
    Sanctum::actingAs(User::factory()->admin()->create());
});

it('lists both tariffs with money objects', function (): void {
    $this->getJson('/api/v1/admin/fare-settings')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.service_type', 'pabili')
        ->assertJsonPath('data.0.service_fee.formatted', '₱20.00')
        ->assertJsonPath('data.1.service_type', 'pasuyo');
});

it('updates a tariff and the next quote uses it', function (): void {
    $customer = User::factory()->create();
    $trip = ['service_type' => 'pasuyo', 'pickup' => ['latitude' => 10.3119, 'longitude' => 123.918], 'dropoff' => ['latitude' => 10.3181, 'longitude' => 123.905]];

    Sanctum::actingAs($customer);
    $before = $this->postJson('/api/v1/customer/bookings/quote', $trip)->assertOk()->json('data.fare.base_fare.centavos');

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->putJson('/api/v1/admin/fare-settings/pasuyo', [
        'base_fare' => '60',
        'included_distance_meters' => 1000,
        'per_km' => '12.50',
        'service_fee' => '5',
        'minimum_fare' => '65.00',
        'commission_rate' => '12.5',
    ])
        ->assertOk()
        ->assertJsonPath('data.commission_rate_bps', 1250)
        ->assertJsonPath('data.base_fare.centavos', 6000)
        ->assertJsonPath('data.per_km.centavos', 1250)
        ->assertJsonPath('data.minimum_fare.formatted', '₱65.00');

    Sanctum::actingAs($customer);
    $after = $this->postJson('/api/v1/customer/bookings/quote', $trip)->assertOk()->json('data.fare');

    expect($before)->toBe(4900)
        ->and($after['base_fare']['centavos'])->toBe(6000)
        ->and($after['service_fee']['centavos'])->toBe(500)
        ->and(FareSetting::query()->where('service_type', 'pasuyo')->sole()->included_distance_meters)->toBe(1000);
});

it('rejects float-looking or negative money', function (): void {
    $this->putJson('/api/v1/admin/fare-settings/pabili', [
        'base_fare' => '59.999',
        'included_distance_meters' => -1,
        'per_km' => 'ten',
        'service_fee' => '20',
        'minimum_fare' => '79',
    ])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['base_fare', 'included_distance_meters', 'per_km']]);
});

it('answers 404 for an unknown service type', function (): void {
    $this->putJson('/api/v1/admin/fare-settings/teleport', [])->assertNotFound();
});

it('is closed to customers and riders', function (): void {
    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/v1/admin/fare-settings')->assertForbidden();

    Sanctum::actingAs(User::factory()->rider()->create());
    $this->getJson('/api/v1/admin/dashboard')->assertForbidden();
});
