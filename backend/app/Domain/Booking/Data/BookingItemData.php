<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

/**
 * One line of a Pabili order: either a product from the store's catalogue
 * (productId set, price snapshotted on creation) or something the customer
 * typed themselves (productId null, no price).
 */
final readonly class BookingItemData
{
    public function __construct(
        public string $name,
        public int $quantity,
        public ?string $note,
        public ?int $productId = null,
        public ?int $unitPriceCentavos = null,
    ) {}

    public function withPrice(string $name, int $unitPriceCentavos): self
    {
        return new self($name, $this->quantity, $this->note, $this->productId, $unitPriceCentavos);
    }

    /** @return array{name: string, quantity: int, note: string|null, product_id: int|null, unit_price_centavos: int|null} */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'quantity' => $this->quantity,
            'note' => $this->note,
            'product_id' => $this->productId,
            'unit_price_centavos' => $this->unitPriceCentavos,
        ];
    }
}
