<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Models\FareSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FareSetting>
 */
final class FareSettingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_type' => ServiceType::Pasuyo,
            'base_fare_centavos' => 4900,
            'included_distance_meters' => 2000,
            'per_km_centavos' => 1000,
            'service_fee_centavos' => 0,
            'minimum_fare_centavos' => 4900,
        ];
    }

    public function pabili(): static
    {
        return $this->state(fn (): array => [
            'service_type' => ServiceType::Pabili,
            'base_fare_centavos' => 5900,
            'service_fee_centavos' => 2000,
            'minimum_fare_centavos' => 7900,
        ]);
    }
}
