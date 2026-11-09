<?php

declare(strict_types=1);

namespace App\Domain\Auth\Data;

use App\Domain\Shared\ValueObjects\PhoneNumber;

final readonly class CreateAdminData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public PhoneNumber $phone,
        /** Set by the creating admin and handed over privately; hashed on save. */
        public string $password,
    ) {}
}
