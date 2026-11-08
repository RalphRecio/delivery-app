<?php

declare(strict_types=1);

namespace App\Domain\Booking\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Exceptions\BookingCannotBeCancelledException;
use App\Domain\Booking\Models\Booking;

/**
 * A customer backing out. Allowed until the rider is on the way; after that
 * only support can cancel (a later phase, with a fee).
 */
final readonly class CancelBookingAction
{
    public function __construct(
        private TransitionBookingStatusAction $transition,
    ) {}

    public function handle(Booking $booking, User $customer, ?string $reason): Booking
    {
        if (! $booking->status->isCancellableByCustomer()) {
            throw new BookingCannotBeCancelledException($booking);
        }

        return $this->transition->handle($booking, BookingStatus::Cancelled, $customer, $reason);
    }
}
