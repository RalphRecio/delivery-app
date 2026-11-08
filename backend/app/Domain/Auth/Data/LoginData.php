<?php

declare(strict_types=1);

namespace App\Domain\Auth\Data;

use App\Domain\Auth\Enums\UserRole;

final readonly class LoginData
{
    public function __construct(
        public string $email,
        public string $password,
        public string $deviceName,
        /** The sign-in page the request came from; null accepts any role (API clients). */
        public ?UserRole $portal = null,
    ) {}
}
