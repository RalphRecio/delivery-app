<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Store\Data\StoreProductData;
use Illuminate\Foundation\Http\FormRequest;

/** Adding and editing a store item take the same fields. */
final class SaveStoreProductRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            // Pesos as a decimal string ("109" or "109.50"); never a float.
            'price' => ['required', 'regex:/^\d{1,6}(\.\d{1,2})?$/'],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['price.regex' => 'Enter the price in pesos, e.g. 109 or 109.50.'];
    }

    public function toData(): StoreProductData
    {
        $description = trim($this->string('description')->toString());

        return new StoreProductData(
            name: trim($this->string('name')->toString()),
            description: $description === '' ? null : $description,
            price: Money::fromPesos((string) $this->validated('price')),
            isAvailable: $this->boolean('is_available', true),
        );
    }
}
