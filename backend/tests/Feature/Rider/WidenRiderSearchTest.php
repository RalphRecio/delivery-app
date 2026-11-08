<?php

declare(strict_types=1);

use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use Illuminate\Support\Facades\Date;

function searchingSince(int $secondsAgo, int $radius = 3000, BookingStatus $status = BookingStatus::Searching): Booking
{
    return Booking::factory()->status($status)->create([
        'search_radius_meters' => $radius,
        'search_widened_at' => Date::now()->subSeconds($secondsAgo),
    ]);
}

it('widens bookings nobody accepted within the offer timeout, up to the maximum', function (): void {
    $stale = searchingSince(90);
    $fresh = searchingSince(10);
    $nearMax = searchingSince(90, radius: 9000);
    $atMax = searchingSince(90, radius: 10000);
    $accepted = searchingSince(90, status: BookingStatus::Accepted);

    $this->artisan('bookings:widen-search')
        ->expectsOutputToContain('Widened 2 booking(s).')
        ->assertSuccessful();

    expect($stale->refresh()->search_radius_meters)->toBe(5000)
        ->and($stale->search_widened_at?->isAfter(Date::now()->subSeconds(5)))->toBeTrue()
        ->and($fresh->refresh()->search_radius_meters)->toBe(3000)
        ->and($nearMax->refresh()->search_radius_meters)->toBe(10000)
        ->and($atMax->refresh()->search_radius_meters)->toBe(10000)
        ->and($accepted->refresh()->search_radius_meters)->toBe(3000);
});

it('is scheduled every minute', function (): void {
    $this->artisan('schedule:list')->expectsOutputToContain('bookings:widen-search');
});
