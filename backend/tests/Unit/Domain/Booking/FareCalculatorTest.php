<?php

declare(strict_types=1);

use App\Domain\Booking\Data\FareSettingsData;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Services\FareCalculator;
use App\Domain\Shared\ValueObjects\Money;

function pasuyoTariff(): FareSettingsData
{
    return new FareSettingsData(
        serviceType: ServiceType::Pasuyo,
        baseFare: Money::fromCentavos(4900),
        includedDistanceMeters: 2000,
        perKm: Money::fromCentavos(1000),
        serviceFee: Money::zero(),
        minimumFare: Money::fromCentavos(4900),
        commissionRateBps: 1000,
    );
}

it('charges only the base fare inside the included distance', function (int $meters): void {
    $fare = new FareCalculator()->calculate(pasuyoTariff(), $meters);

    expect($fare->chargeableMeters)->toBe(0)
        ->and($fare->distanceFare->centavos)->toBe(0)
        ->and($fare->total->centavos)->toBe(4900);
})->with([0, 1, 1999, 2000]);

it('charges extra distance pro rata per metre, rounded to the centavo', function (int $meters, int $expectedDistanceFare): void {
    $fare = new FareCalculator()->calculate(pasuyoTariff(), $meters);

    expect($fare->distanceFare->centavos)->toBe($expectedDistanceFare)
        ->and($fare->total->centavos)->toBe(4900 + $expectedDistanceFare);
})->with([
    '2.1 km -> ₱1.00' => [2100, 100],
    '3 km -> ₱10.00' => [3000, 1000],
    '2,001 m -> ₱0.01' => [2001, 1],
    '2,000.5 m rounds half up' => [2000, 0],
    '12.345 km -> ₱103.45' => [12345, 10345],
]);

it('applies the minimum fare and the service fee', function (): void {
    $pabili = new FareSettingsData(
        serviceType: ServiceType::Pabili,
        baseFare: Money::fromCentavos(5900),
        includedDistanceMeters: 2000,
        perKm: Money::fromCentavos(1000),
        serviceFee: Money::fromCentavos(2000),
        minimumFare: Money::fromCentavos(9000),
        commissionRateBps: 1000,
    );

    $short = new FareCalculator()->calculate($pabili, 500);
    $long = new FareCalculator()->calculate($pabili, 6000);

    expect($short->baseFare->centavos)->toBe(5900)
        ->and($short->serviceFee->centavos)->toBe(2000)
        ->and($short->total->centavos)->toBe(9000)       // 79 < minimum 90
        ->and($long->distanceFare->centavos)->toBe(4000)
        ->and($long->total->centavos)->toBe(11900);      // 59 + 40 + 20
});

it('serialises every amount as money objects for the API', function (): void {
    $json = json_decode(json_encode(new FareCalculator()->calculate(pasuyoTariff(), 3000)), true);

    expect($json)->toMatchArray([
        'distance_meters' => 3000,
        'chargeable_meters' => 1000,
        'total' => ['centavos' => 5900, 'currency' => 'PHP', 'formatted' => '₱59.00'],
    ]);
});

it('round-trips tariff settings through plain arrays for the cache', function (): void {
    $tariff = pasuyoTariff();

    expect(FareSettingsData::fromArray($tariff->toArray()))->toEqual($tariff);
});
