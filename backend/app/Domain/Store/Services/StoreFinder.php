<?php

declare(strict_types=1);

namespace App\Domain\Store\Services;

use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Enums\StoreCategory;
use App\Domain\Store\Models\Store;
use Illuminate\Database\Eloquent\Builder;

/** Active stores for the customer's list: nearest first when a point is known, by name otherwise. */
final readonly class StoreFinder
{
    /**
     * @param  list<StoreCategory>|null  $categories  null lists every kind of store
     * @return Builder<Store>
     */
    public function query(?GeoPoint $near, ?string $search, ?array $categories = null): Builder
    {
        $query = Store::query()->active();

        if ($categories !== null) {
            $query->whereIn('category', array_map(static fn (StoreCategory $category) => $category->value, $categories));
        }

        if ($search !== null) {
            $query->where('name', 'ilike', '%'.$search.'%');
        }

        if ($near === null) {
            return $query->orderBy('name');
        }

        $ewkt = $near->toEwkt();

        return $query
            ->selectRaw('stores.*, ST_Distance(location, ST_GeogFromText(?)) AS distance_meters', [$ewkt])
            ->orderBy('distance_meters');
    }
}
