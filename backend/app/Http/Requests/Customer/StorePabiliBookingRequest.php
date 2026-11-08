<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Domain\Booking\Data\BookingItemData;
use App\Domain\Booking\Data\CreatePabiliBookingData;
use App\Domain\Booking\Enums\PabiliCategory;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Validation\Rule;

final class StorePabiliBookingRequest extends StoreBookingRequest
{
    private const int MAX_ITEMS = 30;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        // The pickup is optional: a store supplies it, and without a store the
        // rider chooses one near the drop-off (CreateBookingAction::resolvePickup).
        $common = [
            ...$this->commonRules(),
            ...LocationRules::for('pickup', withAddress: true, optional: true),
        ];

        return [
            ...$common,
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'pabili_category' => ['required', Rule::enum(PabiliCategory::class)],
            'items' => ['required', 'array', 'min:1', 'max:'.self::MAX_ITEMS],
            'items.*.name' => ['required_without:items.*.product_id', 'nullable', 'string', 'max:120'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.note' => ['nullable', 'string', 'max:200'],
            // Pesos as a decimal string ("500" or "500.50"); never a float.
            'purchase_budget' => ['required', 'regex:/^\d{1,6}(\.\d{1,2})?$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'purchase_budget.regex' => 'The purchase budget must be an amount in pesos, e.g. 500 or 500.50.',
            'items.*.name.required_without' => 'Name the item or choose a product.',
        ];
    }

    public function toData(): CreatePabiliBookingData
    {
        /** @var list<array{name?: string|null, product_id?: int|string|null, quantity: int|string, note?: string|null}> $items */
        $items = $this->validated('items');
        // validated() rebuilds the array rule by rule, which can reorder rows
        // when some rows lack a key (catalogue items have no name); restore the input order.
        ksort($items);
        $items = array_values($items);
        $storeId = $this->filled('store_id') ? (int) $this->validated('store_id') : null;

        return new CreatePabiliBookingData(
            pickup: $storeId === null && $this->has('pickup') ? $this->pickup() : null,
            dropoff: $this->dropoff(),
            paymentMethod: $this->paymentMethod(),
            notes: $this->notes(),
            idempotencyKey: $this->idempotencyKey(),
            items: array_map(
                static fn (array $item) => new BookingItemData(
                    // Catalogue items get their real name from the store on creation.
                    name: isset($item['name']) && trim((string) $item['name']) !== '' ? trim((string) $item['name']) : 'Product',
                    quantity: (int) $item['quantity'],
                    note: isset($item['note']) && trim($item['note']) !== '' ? trim($item['note']) : null,
                    productId: isset($item['product_id']) ? (int) $item['product_id'] : null,
                ),
                $items,
            ),
            purchaseBudget: Money::fromPesos((string) $this->validated('purchase_budget')),
            category: PabiliCategory::from((string) $this->validated('pabili_category')),
            storeId: $storeId,
        );
    }
}
