<?php

declare(strict_types=1);

namespace App\Domain\Payment\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidWebhookSignatureException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Invalid webhook signature.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_UNAUTHORIZED;
    }
}
