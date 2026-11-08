<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Exceptions\RiderNotDispatchableException;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Rider\Services\DispatchCandidates;
use App\Domain\Rider\Services\RiderAssigner;
use Illuminate\Support\Facades\Log;

/**
 * A dispatcher (admin) puts a rider on a waiting booking, on duty or not
 * (an off-duty rider finds the job when they next open the rider app). The
 * job starts straight away as `accepted`; the rider does not confirm it. Riders
 * can still accept open jobs themselves, and the shared RiderAssigner
 * lock decides whoever is first.
 */
final readonly class DispatchRiderAction
{
    public const string LOG_REASON = 'Assigned by dispatcher';

    public function __construct(
        private DispatchCandidates $candidates,
        private RiderAssigner $assigner,
    ) {}

    public function handle(User $dispatcher, Booking $booking, int $riderId): Booking
    {
        $candidate = $this->candidates->find($booking, $riderId);

        if ($candidate === null) {
            throw RiderNotDispatchableException::notARider();
        }

        if (! $candidate->isAvailable()) {
            throw RiderNotDispatchableException::unavailable($candidate);
        }

        // A rider who never opened the app has no profile yet, and the
        // assigner locks that row to serialize the rider's jobs.
        RiderProfile::forRider($candidate->rider);

        $assigned = $this->assigner->assign($candidate->rider, $booking, actor: $dispatcher, reason: self::LOG_REASON);

        Log::info('Rider dispatched', [
            'booking_id' => $assigned->id,
            'user_id' => $dispatcher->id,
            'rider_id' => $candidate->rider->id,
        ]);

        return $assigned;
    }
}
