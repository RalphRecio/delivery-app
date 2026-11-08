<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Booking\Data\UpdateFareSettingData;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateFareSettingRequest extends FormRequest
{
    /** Pesos as a decimal string, e.g. "49" or "49.50". */
    private const string PESOS = 'regex:/^\d{1,6}(\.\d{1,2})?$/';

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'base_fare' => ['required', self::PESOS],
            'included_distance_meters' => ['required', 'integer', 'min:0', 'max:50000'],
            'per_km' => ['required', self::PESOS],
            'service_fee' => ['required', self::PESOS],
            'minimum_fare' => ['required', self::PESOS],
            // Percent with up to two decimals, e.g. "10" or "12.5"; stored as basis points.
            'commission_rate' => ['required', 'regex:/^\d{1,2}(\.\d{1,2})?$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'regex' => 'The :attribute must be an amount in pesos, e.g. 49 or 49.50.',
            'commission_rate.regex' => 'Enter the commission as a percent from 0 to 99.99, e.g. 10 or 12.5.',
        ];
    }

    public function toData(): UpdateFareSettingData
    {
        return new UpdateFareSettingData(
            baseFare: Money::fromPesos((string) $this->validated('base_fare')),
            includedDistanceMeters: (int) $this->validated('included_distance_meters'),
            perKm: Money::fromPesos((string) $this->validated('per_km')),
            serviceFee: Money::fromPesos((string) $this->validated('service_fee')),
            minimumFare: Money::fromPesos((string) $this->validated('minimum_fare')),
            commissionRateBps: self::percentToBasisPoints((string) $this->validated('commission_rate')),
        );
    }

    /** "12.5" -> 1250 without going through a float. */
    private static function percentToBasisPoints(string $percent): int
    {
        [$whole, $fraction] = array_pad(explode('.', $percent, 2), 2, '');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }
}
