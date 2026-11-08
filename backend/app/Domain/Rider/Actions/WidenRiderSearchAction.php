<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Data\MatchingSettings;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Log;

/**
 * Runs on a schedule. Every booking that has sat at its current radius for
 * longer than the offer timeout gets a wider radius, up to the maximum.
 * Past the maximum it simply keeps waiting; an admin can cancel it.
 */
final readonly class WidenRiderSearchAction
{
    public function __construct(
        private MatchingSettings $settings,
    ) {}

    /** @return int how many bookings were widened */
    public function handle(): int
    {
        $cutoff = Date::now()->subSeconds($this->settings->offerTimeoutSeconds);

        $stale = Booking::query()
            ->where('status', BookingStatus::Searching)
            ->where('search_radius_meters', '<', $this->settings->maxRadiusMeters)
            ->where('search_widened_at', '<=', $cutoff)
            ->get();

        foreach ($stale as $booking) {
            $booking->forceFill([
                'search_radius_meters' => min(
                    ($booking->search_radius_meters ?? 0) + $this->settings->radiusStepMeters,
                    $this->settings->maxRadiusMeters,
                ),
                'search_widened_at' => Date::now(),
            ])->save();

            Log::info('Rider search widened', ['booking_id' => $booking->id, 'radius_meters' => $booking->search_radius_meters]);
        }

        return $stale->count();
    }
}
