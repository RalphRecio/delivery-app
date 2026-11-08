<?php

declare(strict_types=1);

namespace App\Domain\Auth\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class EmailAlreadyRegisteredException extends DomainException
{
    public function __construct()
    {
        parent::__construct('That email already has an account.');
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }

    public function errors(): array
    {
        return ['email' => [$this->getMessage()]];
    }
}
