<?php

declare(strict_types=1);

namespace App\Domain\Booking\Exceptions;

use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidStatusTransitionException extends DomainException
{
    public function __construct(
        public readonly Booking $booking,
        public readonly BookingStatus $from,
        public readonly BookingStatus $to,
    ) {
        parent::__construct("Booking {$booking->reference} cannot move from {$from->value} to {$to->value}.");
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }
}
