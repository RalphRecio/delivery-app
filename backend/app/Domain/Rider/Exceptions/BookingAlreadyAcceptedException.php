<?php

declare(strict_types=1);

namespace App\Domain\Rider\Exceptions;

use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/** Another rider got there first, or the booking left `searching` some other way. */
final class BookingAlreadyAcceptedException extends DomainException
{
    public function __construct(public readonly Booking $booking)
    {
        parent::__construct('This job is no longer available.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }
}
