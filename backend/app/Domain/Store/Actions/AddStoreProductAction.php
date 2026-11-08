<?php

declare(strict_types=1);

namespace App\Domain\Store\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Store\Data\StoreProductData;
use App\Domain\Store\Models\Store;
use App\Domain\Store\Models\StoreProduct;
use Illuminate\Support\Facades\Log;

/** Adds an item to the end of a store's menu. */
final readonly class AddStoreProductAction
{
    public function handle(User $admin, Store $store, StoreProductData $data): StoreProduct
    {
        $nextPosition = (int) $store->products()->max('sort_order') + 1;

        $product = $store->products()->create([
            ...$data->toAttributes(),
            'sort_order' => $nextPosition,
        ]);

        Log::info('Store item added', ['user_id' => $admin->id, 'store_id' => $store->id, 'product_id' => $product->id]);

        return $product->refresh();
    }
}
