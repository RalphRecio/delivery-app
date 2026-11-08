<?php

declare(strict_types=1);

namespace App\Domain\Booking\Models;

use App\Domain\Booking\Data\FareSettingsData;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\ValueObjects\Money;
use Carbon\CarbonImmutable;
use Database\Factories\FareSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * The tariff for one service type, editable by admins. All amounts are
 * integer centavos (see Money).
 *
 * @property int $id
 * @property ServiceType $service_type
 * @property int $base_fare_centavos Charged for every booking
 * @property int $included_distance_meters Distance covered by the base fare
 * @property int $per_km_centavos Charged per kilometre beyond the included distance
 * @property int $service_fee_centavos Flat fee (e.g. Pabili purchase handling)
 * @property int $minimum_fare_centavos Floor for the total
 * @property int $commission_rate_bps Platform commission on the fare, basis points (1000 = 10%)
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 */
#[Fillable(['service_type', 'base_fare_centavos', 'included_distance_meters', 'per_km_centavos', 'service_fee_centavos', 'minimum_fare_centavos', 'commission_rate_bps'])]
#[UseFactory(FareSettingFactory::class)]
final class FareSetting extends Model
{
    /** @use HasFactory<FareSettingFactory> */
    use HasFactory;

    public function toData(): FareSettingsData
    {
        return new FareSettingsData(
            serviceType: $this->service_type,
            baseFare: Money::fromCentavos($this->base_fare_centavos),
            includedDistanceMeters: $this->included_distance_meters,
            perKm: Money::fromCentavos($this->per_km_centavos),
            serviceFee: Money::fromCentavos($this->service_fee_centavos),
            minimumFare: Money::fromCentavos($this->minimum_fare_centavos),
            commissionRateBps: $this->commission_rate_bps,
        );
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'service_type' => ServiceType::class,
            'commission_rate_bps' => 'integer',
            'base_fare_centavos' => 'integer',
            'included_distance_meters' => 'integer',
            'per_km_centavos' => 'integer',
            'service_fee_centavos' => 'integer',
            'minimum_fare_centavos' => 'integer',
        ];
    }
}
