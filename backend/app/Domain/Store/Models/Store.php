<?php

declare(strict_types=1);

namespace App\Domain\Store\Models;

use App\Domain\Shared\Casts\GeoPointCast;
use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Enums\StoreCategory;
use Carbon\CarbonImmutable;
use Database\Factories\StoreFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A merchant a customer can order from with Pabili. The store's location is
 * the pickup of every booking made from its catalogue.
 *
 * @property int $id
 * @property string $name
 * @property StoreCategory $category
 * @property string $address
 * @property string|null $landmark
 * @property GeoPoint $location
 * @property bool $is_active
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, StoreProduct> $products
 */
#[Fillable(['name', 'category', 'address', 'landmark', 'location', 'is_active'])]
#[UseFactory(StoreFactory::class)]
final class Store extends Model
{
    /** @use HasFactory<StoreFactory> */
    use HasFactory;

    /** @return HasMany<StoreProduct, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(StoreProduct::class)->orderBy('sort_order')->orderBy('name');
    }

    /**
     * @param  Builder<Store>  $query
     * @return Builder<Store>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => StoreCategory::class,
            'location' => GeoPointCast::class,
            'is_active' => 'boolean',
        ];
    }
}
