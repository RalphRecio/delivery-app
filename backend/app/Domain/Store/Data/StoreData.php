<?php

declare(strict_types=1);

namespace App\Domain\Store\Data;

use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Enums\StoreCategory;

/** A store as an admin enters it; also used for edits (all fields are sent). */
final readonly class StoreData
{
    public function __construct(
        public string $name,
        public StoreCategory $category,
        public string $address,
        public ?string $landmark,
        /** Becomes the pickup of every booking made from this store. */
        public GeoPoint $location,
        public bool $isActive,
    ) {}

    /** @return array<string, mixed> */
    public function toAttributes(): array
    {
        return [
            'name' => $this->name,
            'category' => $this->category,
            'address' => $this->address,
            'landmark' => $this->landmark,
            'location' => $this->location,
            'is_active' => $this->isActive,
        ];
    }
}
