<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Shared\ValueObjects\Money;
use JsonSerializable;

/** How a fare was arrived at. Shown to the customer before they confirm. */
final readonly class FareBreakdownData implements JsonSerializable
{
    public function __construct(
        public int $distanceMeters,
        public int $chargeableMeters,
        public Money $baseFare,
        public Money $distanceFare,
        public Money $serviceFee,
        public Money $total,
    ) {}

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'distance_meters' => $this->distanceMeters,
            'chargeable_meters' => $this->chargeableMeters,
            'base_fare' => $this->baseFare,
            'distance_fare' => $this->distanceFare,
            'service_fee' => $this->serviceFee,
            'total' => $this->total,
        ];
    }
}
