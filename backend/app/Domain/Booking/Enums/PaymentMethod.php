<?php

declare(strict_types=1);

namespace App\Domain\Booking\Enums;

/** Cash on delivery is the only method until the payment gateway phase. */
enum PaymentMethod: string
{
    case Cash = 'cash';

    /**
     * The rider collects the money (cash on delivery), so the platform takes
     * its commission from the rider's wallet. Online methods, when added, are
     * collected by the platform and settle differently.
     */
    public function isCollectedByRider(): bool
    {
        return match ($this) {
            self::Cash => true,
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $method) => $method->value, self::cases());
    }
}
