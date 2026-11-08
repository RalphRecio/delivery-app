<?php

declare(strict_types=1);

use App\Domain\Shared\ValueObjects\GeoPoint;

describe('GeoPoint', function (): void {
    it('rejects coordinates outside the valid ranges', function (float $lat, float $lng): void {
        new GeoPoint($lat, $lng);
    })->with([
        [91.0, 0.0],
        [-91.0, 0.0],
        [0.0, 181.0],
        [0.0, -181.0],
    ])->throws(InvalidArgumentException::class);

    it('measures zero distance to itself', function (): void {
        $point = new GeoPoint(14.5547, 121.0244);

        expect($point->distanceTo($point))->toBe(0.0);
    });

    it('measures one degree of latitude as roughly 111 km', function (): void {
        $distance = (new GeoPoint(0.0, 0.0))->distanceTo(new GeoPoint(1.0, 0.0));

        expect($distance)->toBeGreaterThan(111_100.0)->toBeLessThan(111_300.0);
    });

    it('measures Makati to Quezon City as roughly 13.6 km', function (): void {
        $makati = new GeoPoint(14.5547, 121.0244);
        $quezonCity = new GeoPoint(14.6760, 121.0437);

        expect($makati->distanceTo($quezonCity))->toBeGreaterThan(13_000.0)->toBeLessThan(14_000.0);
    });

    it('writes PostGIS text with longitude first', function (): void {
        expect((new GeoPoint(14.5547, 121.0244))->toEwkt())->toBe('SRID=4326;POINT(121.024400 14.554700)');
    });

    it('serialises as latitude and longitude', function (): void {
        expect((new GeoPoint(1.5, 2.5))->jsonSerialize())->toBe(['latitude' => 1.5, 'longitude' => 2.5]);
    });
});
