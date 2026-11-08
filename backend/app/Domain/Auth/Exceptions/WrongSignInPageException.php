<?php

declare(strict_types=1);

namespace App\Domain\Auth\Exceptions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Shared\Exceptions\DomainException;

/**
 * Correct credentials, wrong door: each role signs in on its own page.
 * Raised only after the password checks out, so it reveals nothing to
 * someone who does not already know the password.
 */
final class WrongSignInPageException extends DomainException
{
    public function __construct(public readonly UserRole $accountRole)
    {
        parent::__construct("This is a {$accountRole->value} account. Sign in on the {$accountRole->value} sign-in page.");
    }

    public function errors(): array
    {
        return ['email' => [$this->getMessage()]];
    }
}
