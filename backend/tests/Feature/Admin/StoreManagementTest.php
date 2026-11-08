<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Store\Models\Store;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::factory()->admin()->create();
    Sanctum::actingAs($this->admin);
});

function storePayload(array $overrides = []): array
{
    return [
        'name' => ' Parang Public Market Stall 12 ',
        'category' => 'grocery',
        'address' => 'Poblacion, Parang, Maguindanao',
        'landmark' => 'Beside the fish section',
        'latitude' => 7.3745,
        'longitude' => 124.2689,
        ...$overrides,
    ];
}

it('adds a store, active by default', function (): void {
    $this->postJson('/api/v1/admin/stores', storePayload())
        ->assertCreated()
        ->assertJsonPath('data.name', 'Parang Public Market Stall 12')
        ->assertJsonPath('data.category_label', 'Grocery')
        ->assertJsonPath('data.location.latitude', 7.3745)
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('data.products', []);

    expect(Store::query()->sole()->landmark)->toBe('Beside the fish section');
});

it('validates the store', function (): void {
    $this->postJson('/api/v1/admin/stores', ['category' => 'casino', 'latitude' => 95])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['name', 'category', 'address', 'latitude', 'longitude']]);
});

it('adds items that customers then see, and hides sold-out ones', function (): void {
    $storeId = $this->postJson('/api/v1/admin/stores', storePayload())->json('data.id');

    $this->postJson("/api/v1/admin/stores/{$storeId}/products", ['name' => 'Rice, 1 kg', 'price' => '58.50'])
        ->assertCreated()
        ->assertJsonPath('data.price.centavos', 5850)
        ->assertJsonPath('data.is_available', true);
    $eggs = $this->postJson("/api/v1/admin/stores/{$storeId}/products", ['name' => 'Eggs, tray', 'description' => '30 pcs', 'price' => '240'])
        ->json('data.id');

    $this->putJson("/api/v1/admin/stores/{$storeId}/products/{$eggs}", ['name' => 'Eggs, tray', 'price' => '245', 'is_available' => false])
        ->assertOk()
        ->assertJsonPath('data.is_available', false);

    $this->getJson("/api/v1/admin/stores/{$storeId}")->assertJsonCount(2, 'data.products');

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/customer/stores/{$storeId}")
        ->assertOk()
        ->assertJsonCount(1, 'data.products')
        ->assertJsonPath('data.products.0.name', 'Rice, 1 kg');
});

it('rejects a price that is not pesos', function (): void {
    $store = Store::factory()->create();

    $this->postJson("/api/v1/admin/stores/{$store->id}/products", ['name' => 'Rice', 'price' => '58.555'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.price.0', 'Enter the price in pesos, e.g. 109 or 109.50.');
});

it('edits a store and can take it off the customer list', function (): void {
    $store = Store::factory()->create(['name' => 'Old Name']);

    $this->putJson("/api/v1/admin/stores/{$store->id}", storePayload(['name' => 'New Name', 'is_active' => false]))
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.is_active', false);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/v1/customer/stores')->assertOk()->assertJsonCount(0, 'data');
});

it('lists every store with item counts and searches by name', function (): void {
    $open = Store::factory()->create(['name' => 'Alpha Mart']);
    $open->products()->create(['name' => 'Water', 'price_centavos' => 2000]);
    $open->products()->create(['name' => 'Bread', 'price_centavos' => 5000, 'is_available' => false]);
    Store::factory()->inactive()->create(['name' => 'Beta Bakery']);

    $this->getJson('/api/v1/admin/stores?per_page=10')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.total', 2);

    $this->getJson('/api/v1/admin/stores?search=alpha')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.products_count', 2)
        ->assertJsonPath('data.0.available_products_count', 1);
});

it('will not edit an item through another store', function (): void {
    $store = Store::factory()->create();
    $other = Store::factory()->create();
    $item = $other->products()->create(['name' => 'Water', 'price_centavos' => 2000]);

    $this->putJson("/api/v1/admin/stores/{$store->id}/products/{$item->id}", ['name' => 'Hacked', 'price' => '1'])
        ->assertNotFound();
});

it('is for admins only', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/v1/admin/stores')->assertForbidden();
    $this->postJson('/api/v1/admin/stores', storePayload())->assertForbidden();
});
