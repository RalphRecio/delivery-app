<?php

declare(strict_types=1);

namespace App\Domain\Auth\Data;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Shared\ValueObjects\PhoneNumber;

final readonly class RegisterAccountData
{
    public function __construct(
        /** Customer or rider; the request never lets anyone pick admin. */
        public UserRole $role,
        public string $firstName,
        public string $lastName,
        /** Lower-cased by the request. */
        public string $email,
        /** Plain text; hashed by the model cast on save. */
        public string $password,
        /** Contact number shown to the other party on a booking; never used to sign in. */
        public PhoneNumber $phone,
        public string $deviceName,
    ) {}
}
