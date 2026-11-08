<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Actions\TransitionBookingStatusAction;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Exceptions\InvalidStatusTransitionException;
use App\Domain\Booking\Models\Booking;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Support\Facades\DB;

/**
 * The rider moving a job forward: picking_up, in_transit, completed.
 * Cancelling is not a rider action; that goes through support.
 */
final readonly class ProgressBookingAction
{
    private const array RIDER_STATUSES = [BookingStatus::PickingUp, BookingStatus::InTransit, BookingStatus::Completed];

    public function __construct(
        private TransitionBookingStatusAction $transition,
        private WalletService $wallets,
    ) {}

    public function handle(User $rider, Booking $booking, BookingStatus $to): Booking
    {
        if (! in_array($to, self::RIDER_STATUSES, true)) {
            throw new InvalidStatusTransitionException($booking, $booking->status, $to);
        }

        // One transaction: a completed booking always has its commission, or neither happens.
        return DB::transaction(function () use ($booking, $to, $rider): Booking {
            $updated = $this->transition->handle($booking, $to, $rider);

            if ($to === BookingStatus::Completed) {
                $this->wallets->chargeCommission($updated);
            }

            return $updated;
        });
    }
}
