<?php

declare(strict_types=1);

namespace App\Domain\Auth\Enums;

/**
 * Which part of the app a user belongs to. A user has exactly one role;
 * the route groups in routes/api.php are guarded by it.
 */
enum UserRole: string
{
    case Customer = 'customer';
    case Rider = 'rider';
    case Admin = 'admin';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $role) => $role->value, self::cases());
    }
}
