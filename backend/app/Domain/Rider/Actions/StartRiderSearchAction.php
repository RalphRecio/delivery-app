<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Booking\Actions\TransitionBookingStatusAction;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Data\MatchingSettings;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;

/** Opens a new booking to riders within the initial radius. */
final readonly class StartRiderSearchAction
{
    public function __construct(
        private MatchingSettings $settings,
        private TransitionBookingStatusAction $transition,
    ) {}

    public function handle(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking): Booking {
            $booking->forceFill([
                'search_radius_meters' => $this->settings->initialRadiusMeters,
                'search_widened_at' => Date::now(),
            ])->save();

            return $this->transition->handle($booking, BookingStatus::Searching, null);
        });
    }
}
