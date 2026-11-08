<?php

declare(strict_types=1);

namespace App\Domain\Rider\Services;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Actions\TransitionBookingStatusAction;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Exceptions\BookingAlreadyAcceptedException;
use App\Domain\Rider\Exceptions\RiderHasActiveJobException;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Support\Facades\DB;

/**
 * The one place a rider is put on a booking, whether the rider accepted it
 * or a dispatcher assigned it. Callers check eligibility (online, wallet)
 * first; this class guards the two things that can change under a race.
 *
 * Lock order is rider profile, then booking:
 *  - the rider lock stops two dispatchers (or a dispatcher and the rider
 *    themselves) from giving one rider two jobs at once;
 *  - the booking lock stops two riders from getting the same job.
 */
final readonly class RiderAssigner
{
    public function __construct(
        private RiderMatcher $matcher,
        private TransitionBookingStatusAction $transition,
    ) {}

    /**
     * @param  User  $actor  who made the assignment: the rider, or the dispatcher
     */
    public function assign(User $rider, Booking $booking, User $actor, ?string $reason = null): Booking
    {
        return DB::transaction(function () use ($rider, $booking, $actor, $reason): Booking {
            RiderProfile::query()->where('user_id', $rider->id)->lockForUpdate()->firstOrFail();

            $active = $this->matcher->activeJobFor($rider);

            if ($active !== null) {
                throw new RiderHasActiveJobException($active);
            }

            $locked = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($locked->rider_id !== null || $locked->status !== BookingStatus::Searching) {
                throw new BookingAlreadyAcceptedException($locked);
            }

            $locked->rider_id = $rider->id;
            $locked->save();

            return $this->transition->handle($locked, BookingStatus::Accepted, $actor, $reason);
        });
    }
}
