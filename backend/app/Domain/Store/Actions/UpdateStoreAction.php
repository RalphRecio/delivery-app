<?php

declare(strict_types=1);

namespace App\Domain\Store\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Store\Data\StoreData;
use App\Domain\Store\Models\Store;
use Illuminate\Support\Facades\Log;

/**
 * Edits a store. Bookings already made keep their own copy of the pickup
 * address and item prices, so an edit never changes past orders.
 */
final readonly class UpdateStoreAction
{
    public function handle(User $admin, Store $store, StoreData $data): Store
    {
        $store->update($data->toAttributes());

        Log::info('Store updated', ['user_id' => $admin->id, 'store_id' => $store->id, 'is_active' => $data->isActive]);

        return $store->refresh();
    }
}
