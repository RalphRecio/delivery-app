<?php

declare(strict_types=1);

namespace App\Domain\Booking\Actions;

use App\Domain\Booking\Contracts\DistanceProvider;
use App\Domain\Booking\Data\FareQuoteData;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Services\FareCalculator;
use App\Domain\Booking\Services\FareSettingsRepository;
use App\Domain\Shared\ValueObjects\GeoPoint;

/**
 * The one place a fare is computed, used both for quotes and for creating
 * bookings. Without a pickup (a Pabili where the rider chooses the store) the
 * trip is priced from the drop-off alone: base fare plus service fee.
 */
final readonly class QuoteFareAction
{
    public function __construct(
        private DistanceProvider $distances,
        private FareSettingsRepository $settings,
        private FareCalculator $calculator,
    ) {}

    public function handle(ServiceType $serviceType, ?GeoPoint $pickup, GeoPoint $dropoff): FareQuoteData
    {
        $pickup ??= $dropoff;
        $distanceMeters = $pickup->equals($dropoff) ? 0 : $this->distances->distanceMeters($pickup, $dropoff);
        $fare = $this->calculator->calculate($this->settings->forServiceType($serviceType), $distanceMeters);

        return new FareQuoteData($serviceType, $pickup, $dropoff, $fare);
    }
}
