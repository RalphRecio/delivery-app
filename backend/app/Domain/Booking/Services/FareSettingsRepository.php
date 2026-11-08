<?php

declare(strict_types=1);

namespace App\Domain\Booking\Services;

use App\Domain\Booking\Data\FareSettingsData;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Exceptions\FareSettingsNotConfiguredException;
use App\Domain\Booking\Models\FareSetting;
use Illuminate\Contracts\Cache\Repository as Cache;

/**
 * Tariffs are read on every quote and change rarely, so they are cached.
 * Whoever updates a FareSetting must call forget() (the admin action will).
 */
final readonly class FareSettingsRepository
{
    private const int TTL_SECONDS = 3600;

    public function __construct(
        private Cache $cache,
    ) {}

    public function forServiceType(ServiceType $serviceType): FareSettingsData
    {
        /** @var array{service_type: string, base_fare_centavos: int, included_distance_meters: int, per_km_centavos: int, service_fee_centavos: int, minimum_fare_centavos: int, commission_rate_bps: int}|null $cached */
        $cached = $this->cache->remember(
            self::cacheKey($serviceType),
            self::TTL_SECONDS,
            fn (): ?array => FareSetting::query()->where('service_type', $serviceType->value)->first()?->toData()->toArray(),
        );

        if ($cached === null) {
            $this->forget($serviceType);

            throw new FareSettingsNotConfiguredException($serviceType);
        }

        return FareSettingsData::fromArray($cached);
    }

    public function forget(ServiceType $serviceType): void
    {
        $this->cache->forget(self::cacheKey($serviceType));
    }

    private static function cacheKey(ServiceType $serviceType): string
    {
        // v2: the cached shape gained commission_rate_bps; older entries are simply never read.
        return 'fare_settings:v2:'.$serviceType->value;
    }
}
