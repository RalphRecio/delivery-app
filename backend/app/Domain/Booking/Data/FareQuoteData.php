<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\ValueObjects\GeoPoint;

final readonly class FareQuoteData
{
    public function __construct(
        public ServiceType $serviceType,
        public GeoPoint $pickup,
        public GeoPoint $dropoff,
        public FareBreakdownData $fare,
    ) {}
}
