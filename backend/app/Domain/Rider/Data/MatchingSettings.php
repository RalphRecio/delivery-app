<?php

declare(strict_types=1);

namespace App\Domain\Rider\Data;

use Illuminate\Contracts\Config\Repository;

/** Typed view of config/matching.php. */
final readonly class MatchingSettings
{
    public function __construct(
        public int $initialRadiusMeters,
        public int $radiusStepMeters,
        public int $maxRadiusMeters,
        public int $offerTimeoutSeconds,
        public int $locationStaleSeconds,
        public int $presenceTimeoutSeconds,
    ) {}

    public static function fromConfig(Repository $config): self
    {
        return new self(
            initialRadiusMeters: (int) $config->get('matching.initial_radius_meters'),
            radiusStepMeters: (int) $config->get('matching.radius_step_meters'),
            maxRadiusMeters: (int) $config->get('matching.max_radius_meters'),
            offerTimeoutSeconds: (int) $config->get('matching.offer_timeout_seconds'),
            locationStaleSeconds: (int) $config->get('matching.location_stale_seconds'),
            presenceTimeoutSeconds: (int) $config->get('matching.presence_timeout_seconds'),
        );
    }
}
