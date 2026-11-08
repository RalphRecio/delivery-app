<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Shared\ValueObjects\Money;

final readonly class UpdateFareSettingData
{
    public function __construct(
        public Money $baseFare,
        public int $includedDistanceMeters,
        public Money $perKm,
        public Money $serviceFee,
        public Money $minimumFare,
        /** Basis points (1000 = 10%); applies to bookings created from now on. */
        public int $commissionRateBps,
    ) {}
}
