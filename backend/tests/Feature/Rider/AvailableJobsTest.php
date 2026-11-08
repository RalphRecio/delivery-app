<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Support\Facades\Date;
use Laravel\Sanctum\Sanctum;

/** Cebu points: SM City (rider), Ayala ~1.5 km away, Mactan airport ~12 km away. */
const RIDER_AT = [10.3119, 123.9180];
const NEAR = [10.3181, 123.9050];
const FAR = [10.3075, 123.9790];
const VERY_FAR = [10.1000, 124.1000];

function onlineRiderAt(array $point): User
{
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill([
        'is_online' => true,
        'current_location' => new GeoPoint($point[0], $point[1]),
        'location_updated_at' => Date::now(),
    ])->save();
    Sanctum::actingAs($rider);

    return $rider;
}

function searchingBookingAt(array $pickup, int $radius = 3000): Booking
{
    return Booking::factory()->status(BookingStatus::Searching)->create([
        'pickup_location' => new GeoPoint($pickup[0], $pickup[1]),
        'search_radius_meters' => $radius,
        'search_widened_at' => Date::now(),
    ]);
}

it('lists searching bookings inside their radius, nearest first, with the customer contact', function (): void {
    onlineRiderAt(RIDER_AT);
    $near = searchingBookingAt(NEAR);
    $far = searchingBookingAt(FAR, radius: 10000);
    searchingBookingAt(VERY_FAR, radius: 10000);                     // outside every radius
    searchingBookingAt(NEAR)->forceFill(['status' => BookingStatus::Pending])->save();   // not open yet
    Booking::factory()->status(BookingStatus::Accepted)->create(['rider_id' => User::factory()->rider()]);

    $response = $this->getJson('/api/v1/rider/jobs/available')->assertOk()->assertJsonCount(2, 'data');

    expect($response->json('data.0.id'))->toBe($near->id)
        ->and($response->json('data.1.id'))->toBe($far->id)
        ->and($response->json('data.0.distance_to_pickup_meters'))->toBeGreaterThan(1000)->toBeLessThan(2000)
        ->and($response->json('data.0.customer.phone'))->toBe($near->customer->phone);
});

it('respects each booking\'s own radius', function (): void {
    onlineRiderAt(RIDER_AT);
    searchingBookingAt(FAR, radius: 3000);   // ~6.7 km away, radius too small

    $this->getJson('/api/v1/rider/jobs/available')->assertOk()->assertJsonCount(0, 'data');
});

it('refuses when the rider is offline', function (): void {
    $rider = onlineRiderAt(RIDER_AT);
    RiderProfile::forRider($rider)->forceFill(['is_online' => false])->save();

    $this->getJson('/api/v1/rider/jobs/available')
        ->assertStatus(409)
        ->assertJsonPath('message', 'Go online to see and accept jobs.');
});

it('refuses when the location is missing or stale', function (): void {
    $rider = onlineRiderAt(RIDER_AT);
    RiderProfile::forRider($rider)->forceFill(['location_updated_at' => Date::now()->subMinutes(10)])->save();

    $this->getJson('/api/v1/rider/jobs/available')
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Share your location to see jobs near you.');
});
