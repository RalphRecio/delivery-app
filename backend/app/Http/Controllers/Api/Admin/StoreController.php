<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Auth\Models\User;
use App\Domain\Store\Actions\CreateStoreAction;
use App\Domain\Store\Actions\UpdateStoreAction;
use App\Domain\Store\Models\Store;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListStoresRequest;
use App\Http\Requests\Admin\SaveStoreRequest;
use App\Http\Resources\AdminStoreResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class StoreController extends Controller
{
    /** Every store, active or not, newest first, with item counts. */
    public function index(ListStoresRequest $request): AnonymousResourceCollection
    {
        $stores = Store::query()
            ->when($request->search(), fn (Builder $query, string $term) => $query->where('name', 'ilike', '%'.$term.'%'))
            ->withCount(['products', 'products as available_products_count' => fn (Builder $query) => $query->where('is_available', true)])
            ->latest('id')
            ->paginate($request->perPage());

        return AdminStoreResource::collection($stores);
    }

    public function show(Store $store): AdminStoreResource
    {
        return AdminStoreResource::make($store->load('products'));
    }

    public function store(SaveStoreRequest $request, CreateStoreAction $createStore): JsonResponse
    {
        $store = $createStore->handle($this->admin($request), $request->toData());

        return AdminStoreResource::make($store->load('products'))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(SaveStoreRequest $request, Store $store, UpdateStoreAction $updateStore): AdminStoreResource
    {
        return AdminStoreResource::make($updateStore->handle($this->admin($request), $store, $request->toData())->load('products'));
    }

    private function admin(Request $request): User
    {
        /** @var User $user role:admin middleware guarantees an admin here */
        $user = $request->user();

        return $user;
    }
}
