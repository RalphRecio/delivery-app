<?php

declare(strict_types=1);

namespace App\Domain\Store\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Store\Data\StoreProductData;
use App\Domain\Store\Models\StoreProduct;
use Illuminate\Support\Facades\Log;

/**
 * Edits an item or marks it sold out. Bookings snapshot the price when
 * ordered, so a price change only affects new orders.
 */
final readonly class UpdateStoreProductAction
{
    public function handle(User $admin, StoreProduct $product, StoreProductData $data): StoreProduct
    {
        $product->update($data->toAttributes());

        Log::info('Store item updated', ['user_id' => $admin->id, 'product_id' => $product->id, 'is_available' => $data->isAvailable]);

        return $product->refresh();
    }
}
