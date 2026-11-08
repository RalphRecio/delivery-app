<?php

declare(strict_types=1);

namespace App\Domain\Booking\Contracts;

use App\Domain\Shared\ValueObjects\GeoPoint;

/**
 * Boundary to the maps provider. Today a straight-line estimate; later a
 * routing API (Google Maps) without touching the booking domain.
 */
interface DistanceProvider
{
    /** Travel distance from one point to the other, in whole metres. */
    public function distanceMeters(GeoPoint $from, GeoPoint $to): int;
}
