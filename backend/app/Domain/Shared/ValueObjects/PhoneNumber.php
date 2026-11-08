<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * A Philippine mobile number in E.164 form ("+639171234567").
 *
 * Users type numbers in many shapes ("0917 123 4567", "9171234567",
 * "+63 917-123-4567"); all of them normalise to the same value so one person
 * cannot end up with several accounts. Only PH mobiles are accepted because
 * that is the only market the service operates in and the SMS provider is PH-only.
 */
final readonly class PhoneNumber implements JsonSerializable, Stringable
{
    private const string COUNTRY_CODE = '63';

    /** PH mobile numbers are "9" followed by nine digits (after the country code). */
    private const string NATIONAL_PATTERN = '/^9\d{9}$/';

    private function __construct(
        public string $value,
    ) {}

    public static function fromString(string $input): self
    {
        $phone = self::tryFromString($input);

        if ($phone === null) {
            throw new InvalidArgumentException("'{$input}' is not a valid Philippine mobile number.");
        }

        return $phone;
    }

    public static function tryFromString(string $input): ?self
    {
        $national = self::toNationalDigits($input);

        if ($national === null || preg_match(self::NATIONAL_PATTERN, $national) !== 1) {
            return null;
        }

        return new self('+'.self::COUNTRY_CODE.$national);
    }

    public static function isValid(string $input): bool
    {
        return self::tryFromString($input) !== null;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    /** "+63917*****67": safe to put in logs and on screen. */
    public function masked(): string
    {
        return substr($this->value, 0, 6).'*****'.substr($this->value, -2);
    }

    public function jsonSerialize(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    /**
     * Strips formatting and the country prefix in any of its spellings,
     * leaving the ten national digits ("9171234567") or null if unrecognisable.
     */
    private static function toNationalDigits(string $input): ?string
    {
        $trimmed = trim($input);
        $hasPlus = str_starts_with($trimmed, '+');
        $digits = preg_replace('/\D+/', '', $trimmed) ?? '';

        if ($digits === '') {
            return null;
        }

        // "+63..." or "63..." (12 digits total)
        if (str_starts_with($digits, self::COUNTRY_CODE) && strlen($digits) === 12) {
            return substr($digits, 2);
        }

        // Anything else written with a leading "+" is a foreign number.
        if ($hasPlus) {
            return null;
        }

        // "09..." (11 digits), the everyday local form
        if (str_starts_with($digits, '0') && strlen($digits) === 11) {
            return substr($digits, 1);
        }

        // "9..." (10 digits)
        if (strlen($digits) === 10) {
            return $digits;
        }

        return null;
    }
}
