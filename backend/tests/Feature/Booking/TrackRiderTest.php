<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Support\Facades\Date;
use Laravel\Sanctum\Sanctum;

function riderAt(float $latitude, float $longitude): User
{
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill([
        'is_online' => true,
        'current_location' => new GeoPoint($latitude, $longitude),
        'location_updated_at' => Date::now(),
    ])->save();

    return $rider;
}

it('shows the customer where the rider is while the job is active', function (BookingStatus $status): void {
    $customer = User::factory()->create();
    $booking = Booking::factory()->status($status)->for($customer, 'customer')->create(['rider_id' => riderAt(10.3201, 123.9011)->id]);

    Sanctum::actingAs($customer);

    $this->getJson("/api/v1/customer/bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.rider_location.latitude', 10.3201)
        ->assertJsonPath('data.rider_location.longitude', 123.9011)
        ->assertJsonPath('data.rider_location.updated_at', fn ($value) => is_string($value));
})->with([BookingStatus::Accepted, BookingStatus::PickingUp, BookingStatus::InTransit]);

it('hides the rider position once the job is over', function (BookingStatus $status): void {
    $customer = User::factory()->create();
    $booking = Booking::factory()->status($status)->for($customer, 'customer')->create(['rider_id' => riderAt(10.3201, 123.9011)->id]);

    Sanctum::actingAs($customer);

    $this->getJson("/api/v1/customer/bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.rider_location', null);
})->with([BookingStatus::Completed, BookingStatus::Cancelled]);

it('has no position before a rider accepts', function (): void {
    $customer = User::factory()->create();
    $booking = Booking::factory()->status(BookingStatus::Searching)->for($customer, 'customer')->create();

    Sanctum::actingAs($customer);

    $this->getJson("/api/v1/customer/bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.rider_location', null);
});

it('never shows the rider position to another customer', function (): void {
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => riderAt(10.3201, 123.9011)->id]);

    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/v1/customer/bookings/{$booking->id}")->assertForbidden();
});

it('leaves the rider position out of lists', function (): void {
    $customer = User::factory()->create();
    Booking::factory()->status(BookingStatus::InTransit)->for($customer, 'customer')->create(['rider_id' => riderAt(10.3201, 123.9011)->id]);

    Sanctum::actingAs($customer);

    $this->getJson('/api/v1/customer/bookings')
        ->assertOk()
        ->assertJsonMissingPath('data.0.rider_location');
});
