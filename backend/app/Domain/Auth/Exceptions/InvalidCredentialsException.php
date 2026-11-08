<?php

declare(strict_types=1);

namespace App\Domain\Auth\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

/** One message for a wrong email and a wrong password, so neither can be probed. */
final class InvalidCredentialsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Email or password is incorrect.');
    }

    public function errors(): array
    {
        return ['email' => [$this->getMessage()]];
    }
}
