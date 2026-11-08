<?php

declare(strict_types=1);

namespace App\Domain\Booking\Enums;

enum ServiceType: string
{
    /** Rider buys the listed items at a store, pays, and delivers them. */
    case Pabili = 'pabili';

    /** Rider picks up a parcel at A and brings it to B. */
    case Pasuyo = 'pasuyo';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $type) => $type->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Pabili => 'Pabili',
            self::Pasuyo => 'Pasuyo',
        };
    }
}
