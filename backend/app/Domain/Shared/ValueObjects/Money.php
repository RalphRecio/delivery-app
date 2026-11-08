<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * An amount of Philippine pesos held as an integer number of centavos.
 *
 * Floats are never used: integer arithmetic is exact, so fares, fees and
 * commissions always add up to the centavo. See docs/adr/0005.
 */
final readonly class Money implements JsonSerializable, Stringable
{
    public const string CURRENCY = 'PHP';

    private const int CENTAVOS_PER_PESO = 100;

    private const int BASIS_POINTS_PER_WHOLE = 10_000;

    private function __construct(public int $centavos) {}

    public static function fromCentavos(int $centavos): self
    {
        return new self($centavos);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    /**
     * Parses a decimal peso string such as "1234.50" or "-5".
     *
     * A string is required instead of a float so callers can never hand us a
     * value that already carries binary floating-point error.
     */
    public static function fromPesos(string $amount): self
    {
        if (preg_match('/^(-)?(\d+)(?:\.(\d{1,2}))?$/', trim($amount), $matches) !== 1) {
            throw new InvalidArgumentException("Invalid peso amount: \"{$amount}\".");
        }

        $sign = $matches[1] === '-' ? -1 : 1;
        $pesos = (int) $matches[2];
        $centavos = (int) str_pad($matches[3] ?? '0', 2, '0');

        return new self($sign * ($pesos * self::CENTAVOS_PER_PESO + $centavos));
    }

    public function add(self $other): self
    {
        return new self($this->centavos + $other->centavos);
    }

    public function subtract(self $other): self
    {
        return new self($this->centavos - $other->centavos);
    }

    public function multiply(int $factor): self
    {
        return new self($this->centavos * $factor);
    }

    /**
     * Applies a percentage expressed in basis points (1% = 100 bp, 12.5% = 1250 bp).
     * Rounds half away from zero, so a 10% commission on ₱0.05 is ₱0.01, not ₱0.00.
     */
    public function percentage(int $basisPoints): self
    {
        $product = $this->centavos * $basisPoints;
        $sign = $product < 0 ? -1 : 1;
        $half = intdiv(self::BASIS_POINTS_PER_WHOLE, 2);

        return new self($sign * intdiv(abs($product) + $half, self::BASIS_POINTS_PER_WHOLE));
    }

    public function isZero(): bool
    {
        return $this->centavos === 0;
    }

    public function isNegative(): bool
    {
        return $this->centavos < 0;
    }

    public function equals(self $other): bool
    {
        return $this->centavos === $other->centavos;
    }

    public function isGreaterThan(self $other): bool
    {
        return $this->centavos > $other->centavos;
    }

    public function isLessThan(self $other): bool
    {
        return $this->centavos < $other->centavos;
    }

    /** Plain decimal string without separators, e.g. "1234.50". Suitable for storage and APIs. */
    public function toDecimalString(): string
    {
        $absolute = abs($this->centavos);

        return sprintf(
            '%s%d.%02d',
            $this->centavos < 0 ? '-' : '',
            intdiv($absolute, self::CENTAVOS_PER_PESO),
            $absolute % self::CENTAVOS_PER_PESO,
        );
    }

    /** Human-readable string with the peso sign and thousands separators, e.g. "₱1,234.50". */
    public function format(): string
    {
        $absolute = abs($this->centavos);

        return sprintf(
            '%s₱%s.%02d',
            $this->centavos < 0 ? '-' : '',
            number_format(intdiv($absolute, self::CENTAVOS_PER_PESO)),
            $absolute % self::CENTAVOS_PER_PESO,
        );
    }

    /** @return array{centavos: int, currency: string, formatted: string} */
    public function jsonSerialize(): array
    {
        return [
            'centavos' => $this->centavos,
            'currency' => self::CURRENCY,
            'formatted' => $this->format(),
        ];
    }

    public function __toString(): string
    {
        return $this->format();
    }
}
