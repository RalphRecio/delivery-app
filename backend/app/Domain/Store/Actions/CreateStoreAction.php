<?php

declare(strict_types=1);

namespace App\Domain\Store\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Store\Data\StoreData;
use App\Domain\Store\Models\Store;
use Illuminate\Support\Facades\Log;

/** Adds a store to the Pabili catalogue. It shows to customers once it is active and has items. */
final readonly class CreateStoreAction
{
    public function handle(User $admin, StoreData $data): Store
    {
        $store = Store::query()->create($data->toAttributes());

        Log::info('Store created', ['user_id' => $admin->id, 'store_id' => $store->id]);

        // Reload so the location comes back through its cast and timestamps are present.
        return $store->refresh();
    }
}
