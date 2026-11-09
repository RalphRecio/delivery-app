<?php

declare(strict_types=1);

namespace App\Domain\Auth\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class EmailAlreadyRegisteredException extends DomainException
{
    public function __construct(string $message = 'That email already has an account.')
    {
        parent::__construct($message);
    }

    /** Creating an admin with a customer's email: point to the explicit promotion instead. */
    public static function belongsToCustomer(): self
    {
        return new self('That email belongs to a customer. Use "Make admin" on the Customers tab instead.');
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
