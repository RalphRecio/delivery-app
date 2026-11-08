<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Models\FareSetting;
use Illuminate\Database\Seeder;

/**
 * Launch tariff. Pabili carries a flat purchase-handling fee on top of the
 * delivery fare. Admins edit these in a later phase; re-seeding does not
 * overwrite edits.
 */
final class FareSettingSeeder extends Seeder
{
    public function run(): void
    {
        $tariffs = [
            ServiceType::Pasuyo->value => [
                'base_fare_centavos' => 4900,     // ₱49 covers the first 2 km
                'included_distance_meters' => 2000,
                'per_km_centavos' => 1000,        // ₱10 per extra km
                'service_fee_centavos' => 0,
                'minimum_fare_centavos' => 4900,
                'commission_rate_bps' => 1000,    // 10% platform commission
            ],
            ServiceType::Pabili->value => [
                'base_fare_centavos' => 5900,
                'included_distance_meters' => 2000,
                'per_km_centavos' => 1000,
                'service_fee_centavos' => 2000,   // ₱20 for queuing and paying at the store
                'minimum_fare_centavos' => 7900,
                'commission_rate_bps' => 1000,
            ],
        ];

        foreach ($tariffs as $serviceType => $tariff) {
            FareSetting::query()->firstOrCreate(['service_type' => $serviceType], $tariff);
        }
    }
}
