<?php

declare(strict_types=1);

namespace App\Domain\Store\Models;

use App\Domain\Shared\ValueObjects\Money;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One item on a store's menu or shelf. Prices are integer centavos and are
 * snapshotted onto the booking when ordered.
 *
 * @property int $id
 * @property int $store_id
 * @property string $name
 * @property string|null $description
 * @property int $price_centavos
 * @property bool $is_available
 * @property int $sort_order
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read Store $store
 */
#[Fillable(['store_id', 'name', 'description', 'price_centavos', 'is_available', 'sort_order'])]
final class StoreProduct extends Model
{
    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function price(): Money
    {
        return Money::fromCentavos($this->price_centavos);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_centavos' => 'integer',
            'is_available' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
