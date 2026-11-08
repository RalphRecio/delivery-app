<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Booking\Enums\PabiliCategory;
use App\Domain\Booking\Enums\PaymentMethod;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\ValueObjects\Money;

final readonly class CreatePabiliBookingData extends CreateBookingData
{
    /**
     * @param  list<BookingItemData>  $items
     */
    public function __construct(
        /** Null when ordering from a store: the store's location becomes the pickup. */
        ?LocationData $pickup,
        LocationData $dropoff,
        PaymentMethod $paymentMethod,
        ?string $notes,
        ?string $idempotencyKey,
        public array $items,
        /** The most the rider may spend at the store; reimbursed in cash on delivery. */
        public Money $purchaseBudget,
        public PabiliCategory $category,
        public ?int $storeId = null,
    ) {
        parent::__construct($pickup, $dropoff, $paymentMethod, $notes, $idempotencyKey);
    }

    public function serviceType(): ServiceType
    {
        return ServiceType::Pabili;
    }

    public function serviceAttributes(): array
    {
        return [
            'store_id' => $this->storeId,
            'pabili_category' => $this->category,
            'items' => array_map(static fn (BookingItemData $item) => $item->toArray(), $this->items),
            'purchase_budget_centavos' => $this->purchaseBudget->centavos,
        ];
    }
}
