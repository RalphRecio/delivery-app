<?php

declare(strict_types=1);

namespace App\Domain\Store\Enums;

enum StoreCategory: string
{
    case Grocery = 'grocery';
    case Pharmacy = 'pharmacy';
    case Restaurant = 'restaurant';
    case Convenience = 'convenience';
    case Bakery = 'bakery';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $category) => $category->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Grocery => 'Grocery',
            self::Pharmacy => 'Pharmacy',
            self::Restaurant => 'Restaurant',
            self::Convenience => 'Convenience store',
            self::Bakery => 'Bakery',
            self::Other => 'Other',
        };
    }
}
