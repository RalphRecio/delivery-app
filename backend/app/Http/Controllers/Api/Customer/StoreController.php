<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Customer;

use App\Domain\Store\Models\Store;
use App\Domain\Store\Services\StoreFinder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ListStoresRequest;
use App\Http\Resources\StoreResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class StoreController extends Controller
{
    private const int MAX_STORES = 50;

    /** Active stores, nearest first when the app sends a point, optionally only those that fit a Pabili category. */
    public function index(ListStoresRequest $request, StoreFinder $finder): AnonymousResourceCollection
    {
        $stores = $finder
            ->query($request->near(), $request->search(), $request->storeCategories())
            ->limit(self::MAX_STORES)
            ->get();

        return StoreResource::collection($stores);
    }

    /** One store with its available products. */
    public function show(Store $store): StoreResource
    {
        abort_unless($store->is_active, 404);

        $store->load(['products' => fn ($query) => $query->where('is_available', true)]);

        return StoreResource::make($store);
    }
}
