<?php

declare(strict_types=1);

namespace App\Infrastructure\Maps;

use App\Domain\Booking\Contracts\DistanceProvider;
use App\Domain\Shared\ValueObjects\GeoPoint;

/**
 * Great-circle distance scaled by a road factor. Roads are never straight,
 * and 1.3 is the usual urban ratio of driving distance to straight line.
 * Good enough for a quote until the routing provider is connected.
 */
final readonly class StraightLineDistanceProvider implements DistanceProvider
{
    private const float ROAD_FACTOR = 1.3;

    public function distanceMeters(GeoPoint $from, GeoPoint $to): int
    {
        return (int) round($from->distanceTo($to) * self::ROAD_FACTOR);
    }
}
