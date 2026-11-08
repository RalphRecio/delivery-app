<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Booking\Models\FareSetting;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Http\Request;

/**
 * @mixin FareSetting
 */
final class FareSettingResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'service_type' => $this->service_type->value,
            'base_fare' => Money::fromCentavos($this->base_fare_centavos),
            'included_distance_meters' => $this->included_distance_meters,
            'per_km' => Money::fromCentavos($this->per_km_centavos),
            'service_fee' => Money::fromCentavos($this->service_fee_centavos),
            'minimum_fare' => Money::fromCentavos($this->minimum_fare_centavos),
            'commission_rate_bps' => $this->commission_rate_bps,
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
