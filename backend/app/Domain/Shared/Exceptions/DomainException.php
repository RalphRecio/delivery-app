<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exceptions;

use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Base class for every business-rule failure (invalid status transition,
 * booking already accepted, insufficient wallet balance, ...).
 *
 * Subclasses describe the problem in their name, carry a human-readable
 * message, and declare the HTTP status the API should answer with. The
 * exception handler turns them into the standard JSON envelope.
 */
abstract class DomainException extends RuntimeException
{
    public function httpStatus(): int
    {
        return Response::HTTP_UNPROCESSABLE_ENTITY;
    }

    /**
     * Field-level details, in the same shape as validation errors.
     *
     * @return array<string, list<string>>
     */
    public function errors(): array
    {
        return [];
    }
}
