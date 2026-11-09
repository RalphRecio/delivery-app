<?php

declare(strict_types=1);

namespace App\Domain\Auth\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class CannotPromoteToAdminException extends DomainException
{
    /** Riders carry a profile and wallet, and admins are already admins. */
    public static function notACustomer(): self
    {
        return new self('Only customer accounts can be made admins.');
    }

    /** An admin cannot use the customer app, so an open order would be stranded. */
    public static function hasActiveBooking(): self
    {
        return new self('This customer has a booking in progress. Make them an admin after it is finished or cancelled.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }
}
