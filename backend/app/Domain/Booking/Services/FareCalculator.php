<?php

declare(strict_types=1);

namespace App\Domain\Booking\Services;

use App\Domain\Booking\Data\FareBreakdownData;
use App\Domain\Booking\Data\FareSettingsData;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Pure fare arithmetic in integer centavos.
 *
 *   distance fare = per-km rate × metres beyond the included distance, pro rata
 *   total         = max(base + distance fare + service fee, minimum fare)
 *
 * Pro-rata per metre (not rounded up to whole kilometres) so a 2.1 km trip
 * is not billed like a 3 km one. The result is rounded half-up to the centavo.
 */
final readonly class FareCalculator
{
    private const int METERS_PER_KM = 1000;

    public function calculate(FareSettingsData $settings, int $distanceMeters): FareBreakdownData
    {
        $chargeableMeters = max(0, $distanceMeters - $settings->includedDistanceMeters);

        $distanceFare = Money::fromCentavos(
            intdiv($settings->perKm->centavos * $chargeableMeters + intdiv(self::METERS_PER_KM, 2), self::METERS_PER_KM),
        );

        $subtotal = $settings->baseFare->add($distanceFare)->add($settings->serviceFee);
        $total = $subtotal->isLessThan($settings->minimumFare) ? $settings->minimumFare : $subtotal;

        return new FareBreakdownData(
            distanceMeters: $distanceMeters,
            chargeableMeters: $chargeableMeters,
            baseFare: $settings->baseFare,
            distanceFare: $distanceFare,
            serviceFee: $settings->serviceFee,
            total: $total,
        );
    }
}
