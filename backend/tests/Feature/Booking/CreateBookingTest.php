<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Data\LocationData;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Events\BookingCreated;
use App\Domain\Booking\Models\Booking;
use App\Domain\Store\Models\Store;
use Database\Seeders\FareSettingSeeder;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->seed(FareSettingSeeder::class);
    $this->customer = User::factory()->create();
    Sanctum::actingAs($this->customer);
});

function tripWithAddresses(): array
{
    return [
        'pickup' => ['address' => 'SM City Cebu', 'latitude' => 10.3119, 'longitude' => 123.9180, 'landmark' => 'Main entrance, beside the taxi bay', 'details' => ''],
        'dropoff' => ['address' => 'Ayala Center Cebu', 'latitude' => 10.3181, 'longitude' => 123.9050, 'details' => 'Terraces, 2nd floor, call on arrival'],
    ];
}

function pabiliPayload(): array
{
    return [
        ...tripWithAddresses(),
        'pabili_category' => 'grocery', 'items' => [
            ['name' => 'Bottled water 1L', 'quantity' => 2],
            ['name' => 'Bread', 'quantity' => 1, 'note' => 'Whole wheat if available'],
        ],
        'purchase_budget' => '350.50',
        'notes' => 'Leave at the guard house',
    ];
}

function pasuyoPayload(): array
{
    return [
        ...tripWithAddresses(),
        'recipient_name' => 'Juan dela Cruz',
        'recipient_phone' => '0917 123 4567',
        'parcel_description' => 'Documents in an envelope',
    ];
}

it('creates a pabili booking with a server-computed fare', function (): void {
    Event::fake([BookingCreated::class]);

    $response = $this->postJson('/api/v1/customer/bookings/pabili', [
        ...pabiliPayload(),
        // A client-sent price must be ignored, not trusted.
        'fare' => ['total' => ['centavos' => 1]],
        'total_fare_centavos' => 1,
    ])
        ->assertCreated()
        ->assertJsonPath('data.service_type', 'pabili')
        ->assertJsonPath('data.pabili_category', 'grocery')
        ->assertJsonPath('data.service_label', 'Pabili · Pharmacy & grocery')
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.status_label', 'Pending')
        ->assertJsonPath('data.can_cancel', true)
        ->assertJsonPath('data.payment_method', 'cash')
        ->assertJsonPath('data.fare.base_fare.centavos', 5900)
        ->assertJsonPath('data.fare.service_fee.centavos', 2000)
        ->assertJsonPath('data.purchase_budget.centavos', 35050)
        ->assertJsonPath('data.items.1.note', 'Whole wheat if available')
        ->assertJsonPath('data.pickup.point.latitude', 10.3119)
        ->assertJsonPath('data.pickup.landmark', 'Main entrance, beside the taxi bay')
        ->assertJsonPath('data.pickup.details', null)
        ->assertJsonPath('data.dropoff.landmark', null)
        ->assertJsonPath('data.dropoff.details', 'Terraces, 2nd floor, call on arrival')
        ->assertJsonPath('data.status_logs.0.to_status', 'pending');

    expect($response->json('data.reference'))->toMatch('/^BK-[A-HJ-NP-Z2-9]{8}$/');

    $booking = Booking::query()->sole();

    expect($booking->customer_id)->toBe($this->customer->id)
        ->and($booking->status)->toBe(BookingStatus::Pending)
        ->and($booking->total_fare_centavos)->toBe(5900 + $booking->distance_fare_centavos + 2000)
        ->and($booking->total_fare_centavos)->toBe($response->json('data.fare.total.centavos'))
        ->and($booking->pickup_location->longitude)->toBe(123.918)
        ->and($booking->statusLogs()->count())->toBe(1);

    Event::assertDispatched(BookingCreated::class, fn (BookingCreated $event) => $event->booking->is($booking));
});

it('opens a new booking to riders as soon as it is created', function (): void {
    $response = $this->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())
        ->assertCreated()
        ->assertJsonPath('data.status', 'searching')
        ->assertJsonPath('data.status_label', 'Finding a rider')
        ->assertJsonPath('data.search_radius_meters', 3000)
        ->assertJsonPath('data.can_cancel', true)
        ->assertJsonCount(2, 'data.status_logs')
        ->assertJsonPath('data.status_logs.1.to_status', 'searching');

    expect(Booking::query()->sole()->search_widened_at)->not->toBeNull()
        ->and($response->json('data.rider'))->toBeNull();
});

it('creates a pasuyo booking and normalises the recipient phone', function (): void {
    $this->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())
        ->assertCreated()
        ->assertJsonPath('data.service_type', 'pasuyo')
        ->assertJsonPath('data.recipient_phone', '+639171234567')
        ->assertJsonPath('data.fare.service_fee.centavos', 0)
        ->assertJsonPath('data.items', null);
});

it('replays the same booking for a repeated idempotency key', function (): void {
    $headers = ['Idempotency-Key' => 'client-uuid-1'];

    $first = $this->withHeaders($headers)->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())->assertCreated();
    $second = $this->withHeaders($headers)->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())->assertCreated();

    expect($second->json('data.id'))->toBe($first->json('data.id'))
        ->and(Booking::query()->count())->toBe(1);
});

it('keeps idempotency keys per customer', function (): void {
    $headers = ['Idempotency-Key' => 'shared-key'];
    $this->withHeaders($headers)->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())->assertCreated();

    Sanctum::actingAs(User::factory()->create());
    $this->withHeaders($headers)->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())->assertCreated();

    expect(Booking::query()->count())->toBe(2);
});

it('requires a known pabili category', function (): void {
    $payload = pabiliPayload();
    $payload['pabili_category'] = 'toys';

    $this->postJson('/api/v1/customer/bookings/pabili', $payload)
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pabili_category']]);

    unset($payload['pabili_category']);

    $this->postJson('/api/v1/customer/bookings/pabili', $payload)
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pabili_category']]);
});

it('labels a pasuyo booking without a category', function (): void {
    $this->postJson('/api/v1/customer/bookings/pasuyo', pasuyoPayload())
        ->assertCreated()
        ->assertJsonPath('data.pabili_category', null)
        ->assertJsonPath('data.service_label', 'Pasuyo');
});

it('validates the pabili shopping list and budget', function (): void {
    $this->postJson('/api/v1/customer/bookings/pabili', [
        ...tripWithAddresses(),
        'pabili_category' => 'grocery', 'items' => [],
        'purchase_budget' => '12.345',
    ])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['items', 'purchase_budget']]);
});

it('validates the pasuyo recipient', function (): void {
    $this->postJson('/api/v1/customer/bookings/pasuyo', [
        ...tripWithAddresses(),
        'recipient_name' => '',
        'recipient_phone' => '+14155552671',
    ])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['recipient_name', 'recipient_phone', 'parcel_description']]);
});

it('caps landmark and details length', function (): void {
    $payload = pasuyoPayload();
    $payload['pickup']['landmark'] = str_repeat('x', 121);
    $payload['dropoff']['details'] = str_repeat('x', 256);

    $this->postJson('/api/v1/customer/bookings/pasuyo', $payload)
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pickup.landmark', 'dropoff.details']]);
});

it('requires an address on both locations', function (): void {
    $payload = pasuyoPayload();
    unset($payload['pickup']['address']);

    $this->postJson('/api/v1/customer/bookings/pasuyo', $payload)
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pickup.address']]);
});

function storeWithMenu(): Store
{
    $store = Store::factory()->create(['name' => 'SM Supermarket Cebu', 'landmark' => 'North wing entrance']);
    $store->products()->create(['name' => 'Eggs, 1 dozen', 'price_centavos' => 11500, 'sort_order' => 1]);
    $store->products()->create(['name' => 'Milk 1L', 'price_centavos' => 9800, 'sort_order' => 2]);
    $store->products()->create(['name' => 'Sold out', 'price_centavos' => 100, 'is_available' => false]);

    return $store;
}

it('creates a pabili order from a store: pickup from the store, prices snapshotted, budget checked', function (): void {
    $store = storeWithMenu();
    [$eggs, $milk] = $store->products()->where('is_available', true)->orderBy('sort_order')->get();

    $response = $this->postJson('/api/v1/customer/bookings/pabili', [
        'store_id' => $store->id,
        'dropoff' => ['address' => 'Ayala Center Cebu', 'latitude' => 10.3181, 'longitude' => 123.9050],
        'pabili_category' => 'grocery', 'items' => [
            ['product_id' => $eggs->id, 'quantity' => 2, 'name' => 'client name is ignored'],
            ['product_id' => $milk->id, 'quantity' => 1],
            ['name' => 'A bag of ice', 'quantity' => 1, 'note' => 'if they have it'],
        ],
        'purchase_budget' => '400',
    ])
        ->assertCreated()
        ->assertJsonPath('data.store.name', 'SM Supermarket Cebu')
        ->assertJsonPath('data.pickup.address', $store->address)
        ->assertJsonPath('data.pickup.landmark', 'North wing entrance')
        ->assertJsonPath('data.pickup.details', 'SM Supermarket Cebu')
        ->assertJsonPath('data.items.0.name', 'Eggs, 1 dozen')
        ->assertJsonPath('data.items.0.unit_price_centavos', 11500)
        ->assertJsonPath('data.items.0.quantity', 2)
        ->assertJsonPath('data.items.2.name', 'A bag of ice')
        ->assertJsonPath('data.items.2.unit_price_centavos', null)
        ->assertJsonPath('data.items_subtotal.centavos', 32800)
        ->assertJsonPath('data.purchase_budget.centavos', 40000);

    expect($response->json('data.pickup.point.latitude'))->toBe(10.3119);
});

it('refuses products that are not on the store menu and budgets below the subtotal', function (): void {
    $store = storeWithMenu();
    $eggs = $store->products()->where('name', 'Eggs, 1 dozen')->sole();
    $soldOut = $store->products()->where('name', 'Sold out')->sole();
    $dropoff = ['dropoff' => ['address' => 'Ayala', 'latitude' => 10.3181, 'longitude' => 123.905]];

    $this->postJson('/api/v1/customer/bookings/pabili', [...$dropoff, 'store_id' => $store->id, 'pabili_category' => 'grocery', 'items' => [['product_id' => $soldOut->id, 'quantity' => 1]], 'purchase_budget' => '500'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.items.0', "Product #{$soldOut->id} is not available from this store.");

    $this->postJson('/api/v1/customer/bookings/pabili', [...$dropoff, 'store_id' => $store->id, 'pabili_category' => 'grocery', 'items' => [['product_id' => $eggs->id, 'quantity' => 3]], 'purchase_budget' => '100'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.purchase_budget.0', 'The purchase budget must cover the listed products (₱345.00).');

    $closed = Store::factory()->inactive()->create();
    $this->postJson('/api/v1/customer/bookings/pabili', [...$dropoff, 'store_id' => $closed->id, 'pabili_category' => 'grocery', 'items' => [['name' => 'x', 'quantity' => 1]], 'purchase_budget' => '100'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.store_id.0', 'This store is not taking orders right now.');

    expect(Booking::query()->count())->toBe(0);
});

it('books a pabili without a pickup: the rider chooses a store near the drop-off', function (): void {
    $response = $this->postJson('/api/v1/customer/bookings/pabili', [
        'dropoff' => ['address' => 'Ayala', 'latitude' => 10.3181, 'longitude' => 123.905],
        'pabili_category' => 'grocery', 'items' => [['name' => 'Water', 'quantity' => 1]],
        'purchase_budget' => '100',
    ])
        ->assertCreated()
        ->assertJsonPath('data.pickup.address', LocationData::RIDER_CHOICE_ADDRESS)
        ->assertJsonPath('data.pickup.landmark', null)
        ->assertJsonPath('data.pickup.point.latitude', 10.3181)
        ->assertJsonPath('data.fare.distance_meters', 0)
        ->assertJsonPath('data.fare.distance_fare.centavos', 0);

    $fare = $response->json('data.fare');

    expect($fare['total']['centavos'])->toBe($fare['base_fare']['centavos'] + $fare['service_fee']['centavos']);
});

it('rejects a half-filled pabili pickup', function (): void {
    $this->postJson('/api/v1/customer/bookings/pabili', [
        'pickup' => ['address' => 'Somewhere'],
        'dropoff' => ['address' => 'Ayala', 'latitude' => 10.3181, 'longitude' => 123.905],
        'pabili_category' => 'grocery', 'items' => [['name' => 'Water', 'quantity' => 1]],
        'purchase_budget' => '100',
    ])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pickup.latitude', 'pickup.longitude']]);
});

it('still requires a pickup for a pasuyo', function (): void {
    $payload = pasuyoPayload();
    unset($payload['pickup']);

    $this->postJson('/api/v1/customer/bookings/pasuyo', $payload)
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['pickup']]);
});
