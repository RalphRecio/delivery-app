<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;
use JsonSerializable;

/**
 * A WGS 84 coordinate (the system GPS and PostGIS SRID 4326 use).
 *
 * Distances are approximate great-circle metres (Haversine). They are good
 * enough for fares and search radii; exact routing distance comes from the
 * maps provider.
 */
final readonly class GeoPoint implements JsonSerializable
{
    public const int SRID = 4326;

    private const float EARTH_RADIUS_METERS = 6_371_000.0;

    public function __construct(
        public float $latitude,
        public float $longitude,
    ) {
        if ($latitude < -90.0 || $latitude > 90.0) {
            throw new InvalidArgumentException("Latitude {$latitude} is outside -90..90.");
        }

        if ($longitude < -180.0 || $longitude > 180.0) {
            throw new InvalidArgumentException("Longitude {$longitude} is outside -180..180.");
        }
    }

    /** Great-circle distance to another point, in metres. */
    public function distanceTo(self $other): float
    {
        $latitudeFrom = deg2rad($this->latitude);
        $latitudeTo = deg2rad($other->latitude);
        $deltaLatitude = deg2rad($other->latitude - $this->latitude);
        $deltaLongitude = deg2rad($other->longitude - $this->longitude);

        $a = sin($deltaLatitude / 2) ** 2
            + cos($latitudeFrom) * cos($latitudeTo) * sin($deltaLongitude / 2) ** 2;

        return 2 * self::EARTH_RADIUS_METERS * atan2(sqrt($a), sqrt(1 - $a));
    }

    public function equals(self $other): bool
    {
        return $this->latitude === $other->latitude && $this->longitude === $other->longitude;
    }

    /**
     * Well-known text for PostGIS. Note the order: PostGIS expects "longitude latitude".
     * Use with ST_GeogFromText('SRID=4326;POINT(lng lat)').
     */
    public function toEwkt(): string
    {
        return sprintf('SRID=%d;POINT(%F %F)', self::SRID, $this->longitude, $this->latitude);
    }

    /** @return array{latitude: float, longitude: float} */
    public function jsonSerialize(): array
    {
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}
