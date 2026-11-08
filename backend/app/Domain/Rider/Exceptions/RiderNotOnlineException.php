<?php

declare(strict_types=1);

namespace App\Domain\Rider\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class RiderNotOnlineException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Go online to see and accept jobs.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }
}
