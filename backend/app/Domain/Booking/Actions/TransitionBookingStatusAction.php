<?php

declare(strict_types=1);

namespace App\Domain\Booking\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Events\BookingStatusChanged;
use App\Domain\Booking\Exceptions\InvalidStatusTransitionException;
use App\Domain\Booking\Models\Booking;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The only code that changes a booking's status. Locks the row so two
 * concurrent changes are serialised, checks the state machine, writes the
 * log entry, and announces the change after commit.
 */
final readonly class TransitionBookingStatusAction
{
    /**
     * @param  bool  $isSupportOverride  allows the support-only moves (BookingStatus::canSupportTransitionTo)
     */
    public function handle(Booking $booking, BookingStatus $to, ?User $actor, ?string $reason = null, bool $isSupportOverride = false): Booking
    {
        return DB::transaction(function () use ($booking, $to, $actor, $reason, $isSupportOverride): Booking {
            $locked = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $from = $locked->status;
            $isAllowed = $isSupportOverride ? $from->canSupportTransitionTo($to) : $from->canTransitionTo($to);

            if (! $isAllowed) {
                throw new InvalidStatusTransitionException($locked, $from, $to);
            }

            $locked->status = $to;

            if ($to === BookingStatus::Cancelled) {
                $locked->cancelled_at = Date::now();
                $locked->cancellation_reason = $reason;
            }

            $locked->save();

            $locked->statusLogs()->create([
                'from_status' => $from,
                'to_status' => $to,
                'actor_id' => $actor?->id,
                'reason' => $reason,
            ]);

            Log::info('Booking status changed', [
                'booking_id' => $locked->id,
                'user_id' => $actor?->id,
                'from' => $from->value,
                'to' => $to->value,
            ]);

            DB::afterCommit(fn () => BookingStatusChanged::dispatch($locked, $from, $to));

            return $locked;
        });
    }
}
