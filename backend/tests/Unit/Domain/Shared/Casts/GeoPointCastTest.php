<?php

declare(strict_types=1);

use App\Domain\Shared\Casts\GeoPointCast;

it('decodes the hex EWKB PostGIS returns for a geography point', function (): void {
    // SRID=4326;POINT(123.918 10.3119), little-endian, as produced by PostGIS.
    $hex = '0101000020E6100000'.bin2hex(pack('e', 123.918)).bin2hex(pack('e', 10.3119));

    $point = GeoPointCast::fromEwkbHex($hex);

    expect($point->longitude)->toBe(123.918)
        ->and($point->latitude)->toBe(10.3119);
});

it('rejects values that are not a point', function (): void {
    GeoPointCast::fromEwkbHex('0102000020E6100000'.str_repeat('00', 16));
})->throws(InvalidArgumentException::class);
