<?php

declare(strict_types=1);

namespace App\Domain\Booking\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Data\UpdateFareSettingData;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Models\FareSetting;
use App\Domain\Booking\Services\FareSettingsRepository;
use Illuminate\Support\Facades\Log;

/**
 * Changes a tariff for new quotes. Existing bookings keep their snapshot.
 * The cache is cleared here so the next quote sees the new numbers.
 */
final readonly class UpdateFareSettingAction
{
    public function __construct(
        private FareSettingsRepository $repository,
    ) {}

    public function handle(User $admin, ServiceType $serviceType, UpdateFareSettingData $data): FareSetting
    {
        $setting = FareSetting::query()->updateOrCreate(
            ['service_type' => $serviceType->value],
            [
                'base_fare_centavos' => $data->baseFare->centavos,
                'included_distance_meters' => $data->includedDistanceMeters,
                'per_km_centavos' => $data->perKm->centavos,
                'service_fee_centavos' => $data->serviceFee->centavos,
                'minimum_fare_centavos' => $data->minimumFare->centavos,
                'commission_rate_bps' => $data->commissionRateBps,
            ],
        );

        $this->repository->forget($serviceType);

        Log::info('Fare setting updated', ['user_id' => $admin->id, 'service_type' => $serviceType->value]);

        return $setting;
    }
}
