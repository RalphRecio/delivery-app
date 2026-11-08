<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Store\Enums\StoreCategory;
use App\Domain\Store\Models\Store;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    Sanctum::actingAs(User::factory()->create());
});

it('lists active stores nearest first with their distance', function (): void {
    $near = Store::factory()->at(10.3119, 123.918)->create(['name' => 'Near Mart']);
    $far = Store::factory()->at(10.3345, 123.9122)->create(['name' => 'Far Bakery']);
    Store::factory()->inactive()->create(['name' => 'Closed Shop']);

    $response = $this->getJson('/api/v1/customer/stores?latitude=10.3119&longitude=123.918')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $near->id)
        ->assertJsonPath('data.1.id', $far->id)
        ->assertJsonPath('data.0.distance_meters', 0)
        ->assertJsonPath('data.0.category_label', 'Grocery');

    expect($response->json('data.1.distance_meters'))->toBeGreaterThan(2000)->toBeLessThan(3500);
});

it('lists by name and filters by search when there is no point', function (): void {
    Store::factory()->create(['name' => 'Zed Pharmacy']);
    Store::factory()->create(['name' => 'Abaca Bakery']);

    $this->getJson('/api/v1/customer/stores')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Abaca Bakery')
        ->assertJsonMissingPath('data.0.distance_meters');

    $this->getJson('/api/v1/customer/stores?search=pharm')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/customer/stores?latitude=10')->assertUnprocessable();
});

it('shows a store with only its available products, in order', function (): void {
    $store = Store::factory()->create();
    $store->products()->create(['name' => 'Second', 'price_centavos' => 200, 'sort_order' => 2]);
    $store->products()->create(['name' => 'First', 'price_centavos' => 100, 'sort_order' => 1]);
    $store->products()->create(['name' => 'Gone', 'price_centavos' => 300, 'is_available' => false]);

    $this->getJson("/api/v1/customer/stores/{$store->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data.products')
        ->assertJsonPath('data.products.0.name', 'First')
        ->assertJsonPath('data.products.0.price.formatted', '₱1.00')
        ->assertJsonPath('data.landmark', $store->landmark);

    $closed = Store::factory()->inactive()->create();
    $this->getJson("/api/v1/customer/stores/{$closed->id}")->assertNotFound();
});

it('lists only the kinds of store that fit the Pabili being booked', function (): void {
    Store::factory()->create(['name' => 'Jollibee', 'category' => StoreCategory::Restaurant]);
    Store::factory()->create(['name' => 'Abaca Bakery', 'category' => StoreCategory::Bakery]);
    Store::factory()->create(['name' => 'Mercury Drug', 'category' => StoreCategory::Pharmacy]);

    $names = fn (string $category) => collect($this->getJson("/api/v1/customer/stores?pabili_category={$category}")->assertOk()->json('data'))->pluck('name')->all();

    expect($names('food'))->toBe(['Abaca Bakery', 'Jollibee'])
        ->and($names('grocery'))->toBe(['Abaca Bakery', 'Mercury Drug']);

    $this->getJson('/api/v1/customer/stores?pabili_category=toys')->assertUnprocessable();
    $this->getJson('/api/v1/customer/stores')->assertOk()->assertJsonCount(3, 'data');
});
