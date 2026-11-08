<?php

declare(strict_types=1);

namespace App\Domain\Booking\Exceptions;

use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/** An operator forgot to seed or configure the tariff; nothing the customer can fix. */
final class FareSettingsNotConfiguredException extends DomainException
{
    public function __construct(public readonly ServiceType $serviceType)
    {
        parent::__construct("{$serviceType->label()} is not available right now.");
    }

    public function httpStatus(): int
    {
        return Response::HTTP_SERVICE_UNAVAILABLE;
    }
}
