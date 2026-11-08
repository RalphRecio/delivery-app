<?php

declare(strict_types=1);

namespace App\Domain\Booking\Exceptions;

use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/** The rider is already on the way (or the booking is finished). */
final class BookingCannotBeCancelledException extends DomainException
{
    public function __construct(public readonly Booking $booking)
    {
        parent::__construct('This booking can no longer be cancelled. It is '.strtolower($booking->status->label()).'.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }
}
