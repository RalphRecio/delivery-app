<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Auth\Models\User;
use App\Domain\Store\Actions\AddStoreProductAction;
use App\Domain\Store\Actions\UpdateStoreProductAction;
use App\Domain\Store\Models\Store;
use App\Domain\Store\Models\StoreProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveStoreProductRequest;
use App\Http\Resources\StoreProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class StoreProductController extends Controller
{
    public function store(SaveStoreProductRequest $request, Store $store, AddStoreProductAction $addProduct): JsonResponse
    {
        $product = $addProduct->handle($this->admin($request), $store, $request->toData());

        return StoreProductResource::make($product)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    /** Scoped binding: the item must belong to the store in the URL, otherwise 404. */
    public function update(SaveStoreProductRequest $request, Store $store, StoreProduct $product, UpdateStoreProductAction $updateProduct): JsonResponse
    {
        $product = $updateProduct->handle($this->admin($request), $product, $request->toData());

        return StoreProductResource::make($product)->response()->setStatusCode(Response::HTTP_OK);
    }

    private function admin(Request $request): User
    {
        /** @var User $user role:admin middleware guarantees an admin here */
        $user = $request->user();

        return $user;
    }
}
