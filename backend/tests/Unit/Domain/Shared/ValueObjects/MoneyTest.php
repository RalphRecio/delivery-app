<?php

declare(strict_types=1);

use App\Domain\Shared\ValueObjects\Money;

describe('Money', function (): void {
    it('parses decimal peso strings without floats', function (string $input, int $centavos): void {
        expect(Money::fromPesos($input)->centavos)->toBe($centavos);
    })->with([
        ['0', 0],
        ['1', 100],
        ['1234.50', 123450],
        ['0.05', 5],
        ['7.5', 750],
        ['-12.34', -1234],
    ]);

    it('rejects malformed amounts', function (string $input): void {
        Money::fromPesos($input);
    })->with(['abc', '1.234', '1,000', ''])->throws(InvalidArgumentException::class);

    it('adds, subtracts and multiplies exactly', function (): void {
        $fare = Money::fromCentavos(12_345);

        expect($fare->add(Money::fromCentavos(55))->centavos)->toBe(12_400)
            ->and($fare->subtract(Money::fromCentavos(12_345))->isZero())->toBeTrue()
            ->and($fare->multiply(3)->centavos)->toBe(37_035);
    });

    it('applies basis-point percentages rounding half away from zero', function (int $centavos, int $bp, int $expected): void {
        expect(Money::fromCentavos($centavos)->percentage($bp)->centavos)->toBe($expected);
    })->with([
        'ten percent' => [10_000, 1_000, 1_000],
        'rounds .5 up' => [5, 1_000, 1],
        'rounds .4 down' => [4, 1_000, 0],
        'negative rounds away from zero' => [-5, 1_000, -1],
        'twelve and a half percent' => [8_000, 1_250, 1_000],
    ]);

    it('compares amounts', function (): void {
        $small = Money::fromCentavos(100);
        $large = Money::fromCentavos(200);

        expect($small->isLessThan($large))->toBeTrue()
            ->and($large->isGreaterThan($small))->toBeTrue()
            ->and($small->equals(Money::fromCentavos(100)))->toBeTrue()
            ->and(Money::fromCentavos(-1)->isNegative())->toBeTrue();
    });

    it('formats for storage and for people', function (): void {
        $amount = Money::fromCentavos(1_234_505);

        expect($amount->toDecimalString())->toBe('12345.05')
            ->and($amount->format())->toBe('₱12,345.05')
            ->and((string) Money::fromCentavos(-250))->toBe('-₱2.50')
            ->and(Money::fromCentavos(7)->toDecimalString())->toBe('0.07');
    });

    it('serialises to the API shape', function (): void {
        expect(Money::fromCentavos(12_350)->jsonSerialize())->toBe([
            'centavos' => 12_350,
            'currency' => 'PHP',
            'formatted' => '₱123.50',
        ]);
    });
});
