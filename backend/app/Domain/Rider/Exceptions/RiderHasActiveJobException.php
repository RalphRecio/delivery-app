<?php

declare(strict_types=1);

namespace App\Domain\Rider\Exceptions;

use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/** One job at a time: finish the current one first. */
final class RiderHasActiveJobException extends DomainException
{
    public function __construct(public readonly Booking $activeBooking)
    {
        parent::__construct("Finish your current job ({$activeBooking->reference}) before accepting another.");
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }
}
