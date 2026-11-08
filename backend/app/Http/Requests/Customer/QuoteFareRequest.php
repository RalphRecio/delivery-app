<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class QuoteFareRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        // A Pabili without a pickup is quoted at zero distance: the rider shops near the drop-off.
        $isPabili = $this->input('service_type') === ServiceType::Pabili->value;

        return [
            'service_type' => ['required', Rule::enum(ServiceType::class)],
            ...LocationRules::for('pickup', optional: $isPabili),
            ...LocationRules::for('dropoff'),
        ];
    }

    public function serviceType(): ServiceType
    {
        return ServiceType::from($this->string('service_type')->toString());
    }

    public function pickup(): ?GeoPoint
    {
        return $this->has('pickup') ? LocationRules::point($this, 'pickup') : null;
    }

    public function dropoff(): GeoPoint
    {
        return LocationRules::point($this, 'dropoff');
    }
}
