<?php

declare(strict_types=1);

namespace App\Domain\Auth\Data;

use App\Domain\Auth\Models\User;

/** A freshly issued bearer token together with its owner. */
final readonly class AuthSessionData
{
    public function __construct(
        public User $user,
        /** Plain-text token; shown to the client exactly once. */
        public string $token,
    ) {}
}
