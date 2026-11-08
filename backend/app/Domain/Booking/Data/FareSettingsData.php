<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\ValueObjects\Money;

/** Immutable snapshot of a tariff, so FareCalculator stays free of Eloquent. */
final readonly class FareSettingsData
{
    public function __construct(
        public ServiceType $serviceType,
        public Money $baseFare,
        public int $includedDistanceMeters,
        public Money $perKm,
        public Money $serviceFee,
        public Money $minimumFare,
        /** Platform commission on the fare, in basis points (1000 = 10%). */
        public int $commissionRateBps,
    ) {}

    /**
     * Scalars only, so the cache holds plain data rather than a serialised
     * object that breaks whenever a class is renamed or the cache is read
     * by a process that cannot autoload it.
     *
     * @return array{service_type: string, base_fare_centavos: int, included_distance_meters: int, per_km_centavos: int, service_fee_centavos: int, minimum_fare_centavos: int, commission_rate_bps: int}
     */
    public function toArray(): array
    {
        return [
            'service_type' => $this->serviceType->value,
            'base_fare_centavos' => $this->baseFare->centavos,
            'included_distance_meters' => $this->includedDistanceMeters,
            'per_km_centavos' => $this->perKm->centavos,
            'service_fee_centavos' => $this->serviceFee->centavos,
            'minimum_fare_centavos' => $this->minimumFare->centavos,
            'commission_rate_bps' => $this->commissionRateBps,
        ];
    }

    /**
     * @param  array{service_type: string, base_fare_centavos: int, included_distance_meters: int, per_km_centavos: int, service_fee_centavos: int, minimum_fare_centavos: int, commission_rate_bps: int}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            serviceType: ServiceType::from($data['service_type']),
            baseFare: Money::fromCentavos($data['base_fare_centavos']),
            includedDistanceMeters: $data['included_distance_meters'],
            perKm: Money::fromCentavos($data['per_km_centavos']),
            serviceFee: Money::fromCentavos($data['service_fee_centavos']),
            minimumFare: Money::fromCentavos($data['minimum_fare_centavos']),
            commissionRateBps: $data['commission_rate_bps'],
        );
    }
}
