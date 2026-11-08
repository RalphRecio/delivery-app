<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Domain\Booking\Data\LocationData;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation and parsing of a `{prefix}: { address, latitude, longitude }`
 * block, shared by the quote and booking requests so the shape is identical.
 */
final class LocationRules
{
    /**
     * Optional blocks may be left out entirely, but once present they must be complete.
     *
     * @return array<string, list<mixed>>
     */
    public static function for(string $prefix, bool $withAddress = false, bool $optional = false): array
    {
        $required = $optional ? "required_with:{$prefix}" : 'required';

        $rules = [
            $prefix => [$optional ? 'sometimes' : 'required', 'array'],
            "{$prefix}.latitude" => [$required, 'numeric', 'between:-90,90'],
            "{$prefix}.longitude" => [$required, 'numeric', 'between:-180,180'],
        ];

        if ($withAddress) {
            $rules["{$prefix}.address"] = [$required, 'string', 'max:255'];
            $rules["{$prefix}.landmark"] = ['nullable', 'string', 'max:120'];
            $rules["{$prefix}.details"] = ['nullable', 'string', 'max:255'];
        }

        return $rules;
    }

    public static function point(FormRequest $request, string $prefix): GeoPoint
    {
        return new GeoPoint(
            latitude: $request->float("{$prefix}.latitude"),
            longitude: $request->float("{$prefix}.longitude"),
        );
    }

    public static function location(FormRequest $request, string $prefix): LocationData
    {
        return new LocationData(
            address: $request->string("{$prefix}.address")->toString(),
            point: self::point($request, $prefix),
            landmark: self::optionalText($request, "{$prefix}.landmark"),
            details: self::optionalText($request, "{$prefix}.details"),
        );
    }

    private static function optionalText(FormRequest $request, string $key): ?string
    {
        $value = trim($request->string($key)->toString());

        return $value === '' ? null : $value;
    }
}
