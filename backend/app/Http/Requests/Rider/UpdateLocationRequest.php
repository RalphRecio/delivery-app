<?php

declare(strict_types=1);

namespace App\Http\Requests\Rider;

use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateLocationRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function location(): GeoPoint
    {
        return new GeoPoint(latitude: $this->float('latitude'), longitude: $this->float('longitude'));
    }
}
