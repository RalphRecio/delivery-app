<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Domain\Booking\Enums\PabiliCategory;
use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Enums\StoreCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListStoresRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'latitude' => ['required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['required_with:latitude', 'numeric', 'between:-180,180'],
            'search' => ['sometimes', 'string', 'max:60'],
            'pabili_category' => ['sometimes', Rule::enum(PabiliCategory::class)],
        ];
    }

    /**
     * The kinds of store that fit the Pabili the customer is booking, or
     * null for every store.
     *
     * @return list<StoreCategory>|null
     */
    public function storeCategories(): ?array
    {
        if (! $this->filled('pabili_category')) {
            return null;
        }

        return PabiliCategory::from($this->string('pabili_category')->toString())->storeCategories();
    }

    public function near(): ?GeoPoint
    {
        if (! $this->has('latitude') || ! $this->has('longitude')) {
            return null;
        }

        return new GeoPoint(latitude: $this->float('latitude'), longitude: $this->float('longitude'));
    }

    public function search(): ?string
    {
        $term = trim($this->string('search')->toString());

        return $term === '' ? null : $term;
    }
}
