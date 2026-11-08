<?php

declare(strict_types=1);

namespace App\Domain\Rider\Services;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Data\MatchingSettings;
use App\Domain\Rider\Exceptions\RiderLocationUnknownException;
use App\Domain\Rider\Exceptions\RiderNotOnlineException;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Which bookings a rider may be offered: those still `searching` whose own
 * search radius reaches the rider's last known position, nearest first.
 *
 * Offers are pulled by the rider app (it polls while online) rather than
 * pushed. That keeps this phase free of realtime infrastructure; see ADR 0008.
 */
final readonly class RiderMatcher
{
    private const int MAX_OFFERS = 20;

    public function __construct(
        private MatchingSettings $settings,
    ) {}

    /**
     * @return Collection<int, Booking>
     */
    public function availableJobsFor(User $rider): Collection
    {
        $profile = RiderProfile::forRider($rider);

        if (! $profile->is_online) {
            throw new RiderNotOnlineException;
        }

        if ($profile->current_location === null || ! $profile->hasFreshLocation($this->settings->locationStaleSeconds)) {
            throw new RiderLocationUnknownException;
        }

        return $this->jobsNear($profile->current_location)->limit(self::MAX_OFFERS)->get();
    }

    /** The job a rider is in the middle of, if any. At most one at a time. */
    public function activeJobFor(User $rider): ?Booking
    {
        return Booking::query()
            ->with('customer')
            ->where('rider_id', $rider->id)
            ->whereIn('status', [BookingStatus::Accepted, BookingStatus::PickingUp, BookingStatus::InTransit])
            ->first();
    }

    /**
     * @return Builder<Booking>
     */
    private function jobsNear(GeoPoint $location): Builder
    {
        $ewkt = $location->toEwkt();

        return Booking::query()
            ->with('customer')
            ->where('status', BookingStatus::Searching)
            ->whereNull('rider_id')
            // Each booking carries its own (widening) radius, so the comparison is per row.
            ->whereRaw('ST_DWithin(pickup_location, ST_GeogFromText(?), search_radius_meters)', [$ewkt])
            ->selectRaw('bookings.*, ST_Distance(pickup_location, ST_GeogFromText(?)) AS distance_to_pickup_meters', [$ewkt])
            ->orderBy('distance_to_pickup_meters');
    }
}
