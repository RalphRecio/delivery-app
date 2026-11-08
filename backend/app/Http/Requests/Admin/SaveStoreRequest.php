<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Data\StoreData;
use App\Domain\Store\Enums\StoreCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Creating and editing a store take the same fields. */
final class SaveStoreRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::enum(StoreCategory::class)],
            'address' => ['required', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:120'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function toData(): StoreData
    {
        $landmark = trim($this->string('landmark')->toString());

        return new StoreData(
            name: trim($this->string('name')->toString()),
            category: StoreCategory::from($this->string('category')->toString()),
            address: trim($this->string('address')->toString()),
            landmark: $landmark === '' ? null : $landmark,
            location: new GeoPoint(latitude: $this->float('latitude'), longitude: $this->float('longitude')),
            isActive: $this->boolean('is_active', true),
        );
    }
}
