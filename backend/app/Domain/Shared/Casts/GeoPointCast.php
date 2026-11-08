<?php

declare(strict_types=1);

namespace App\Domain\Shared\Casts;

use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * Maps a PostGIS geography(Point, 4326) column to a GeoPoint.
 *
 * Reading: PostgreSQL hands geography back as hex EWKB
 * ("0101000020E6100000<lng as double><lat as double>"), which is decoded here
 * so models never need a special select.
 * Writing: produces EWKT ("SRID=4326;POINT(lng lat)"), which PostGIS accepts
 * as a bound text parameter for geography columns, so no raw SQL is needed.
 *
 * @implements CastsAttributes<GeoPoint, GeoPoint|null>
 */
final class GeoPointCast implements CastsAttributes
{
    private const int EWKB_SRID_FLAG = 0x20000000;

    private const int WKB_POINT = 1;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?GeoPoint
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            throw new InvalidArgumentException("Column {$key} holds an unexpected geography value.");
        }

        return self::fromEwkbHex($value);
    }

    /**
     * @param  GeoPoint|null  $value
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value?->toEwkt();
    }

    public static function fromEwkbHex(string $hex): GeoPoint
    {
        $binary = hex2bin($hex);

        if ($binary === false || strlen($binary) < 21) {
            throw new InvalidArgumentException('Geography value is not valid EWKB.');
        }

        $littleEndian = ord($binary[0]) === 1;
        $format = $littleEndian ? 'Vtype' : 'Ntype';
        $type = unpack($format, $binary, 1)['type'] ?? 0;

        $hasSrid = ($type & self::EWKB_SRID_FLAG) !== 0;
        $offset = 5 + ($hasSrid ? 4 : 0);

        if (($type & 0xFF) !== self::WKB_POINT) {
            throw new InvalidArgumentException('Geography value is not a point.');
        }

        $doubles = unpack($littleEndian ? 'elng/elat' : 'Elng/Elat', $binary, $offset);

        return new GeoPoint(latitude: (float) $doubles['lat'], longitude: (float) $doubles['lng']);
    }
}
