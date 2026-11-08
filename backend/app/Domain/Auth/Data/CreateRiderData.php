<?php

declare(strict_types=1);

namespace App\Domain\Auth\Data;

use App\Domain\Shared\ValueObjects\PhoneNumber;

final readonly class CreateRiderData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public PhoneNumber $phone,
        /** Set by the admin and handed to the rider; hashed on save. */
        public string $password,
    ) {}
}
