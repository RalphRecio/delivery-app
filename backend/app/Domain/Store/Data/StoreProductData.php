<?php

declare(strict_types=1);

namespace App\Domain\Store\Data;

use App\Domain\Shared\ValueObjects\Money;

/** One item on a store's menu as an admin enters it. */
final readonly class StoreProductData
{
    public function __construct(
        public string $name,
        public ?string $description,
        public Money $price,
        public bool $isAvailable,
    ) {}

    /** @return array<string, mixed> */
    public function toAttributes(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'price_centavos' => $this->price->centavos,
            'is_available' => $this->isAvailable,
        ];
    }
}
