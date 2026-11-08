<?php

declare(strict_types=1);

namespace App\Domain\Booking\Enums;

use App\Domain\Store\Enums\StoreCategory;

/**
 * What kind of shopping a Pabili is. The flow and tariff are the same for
 * all three; the category tells the rider what sort of store to head for and
 * lets the app word its form accordingly.
 */
enum PabiliCategory: string
{
    /** Pharmacy, grocery and more. */
    case Grocery = 'grocery';

    /** Food takeout / food delivery. */
    case Food = 'food';

    /** Cat and dog food, and more. */
    case PetFood = 'pet_food';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $category) => $category->value, self::cases());
    }

    /**
     * Which kinds of store sell this, for the store list a Pabili starts from.
     * Pet food has no pet-shop category yet, so it shows the general stores
     * that usually stock it.
     *
     * @return list<StoreCategory>
     */
    public function storeCategories(): array
    {
        return match ($this) {
            self::Grocery => [StoreCategory::Grocery, StoreCategory::Pharmacy, StoreCategory::Convenience, StoreCategory::Bakery, StoreCategory::Other],
            self::Food => [StoreCategory::Restaurant, StoreCategory::Bakery],
            self::PetFood => [StoreCategory::Grocery, StoreCategory::Convenience, StoreCategory::Other],
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Grocery => 'Pharmacy & grocery',
            self::Food => 'Food takeout',
            self::PetFood => 'Pet food',
        };
    }
}
