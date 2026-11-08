<?php

declare(strict_types=1);

namespace App\Domain\Payment\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class PaymentGatewayUnavailableException extends DomainException
{
    public function __construct(?Throwable $previous = null)
    {
        parent::__construct('Top-ups are unavailable right now. Please try again in a few minutes.', 0, $previous);
    }

    public function httpStatus(): int
    {
        return Response::HTTP_SERVICE_UNAVAILABLE;
    }
}
