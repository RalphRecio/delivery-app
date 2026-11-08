<?php

declare(strict_types=1);

namespace App\Domain\Auth\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class AccountDeactivatedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('This account has been deactivated. Contact support.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_FORBIDDEN;
    }
}
