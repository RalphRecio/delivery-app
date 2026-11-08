<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Rider;

use App\Domain\Auth\Models\User;
use App\Domain\Wallet\Actions\CreateTopupRequestAction;
use App\Domain\Wallet\Models\TopupRequest;
use App\Domain\Wallet\Models\Wallet;
use App\Domain\Wallet\Services\WalletService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rider\CreateTopupRequest;
use App\Http\Requests\Rider\ListWalletTransactionsRequest;
use App\Http\Resources\TopupRequestResource;
use App\Http\Resources\WalletSummaryResource;
use App\Http\Resources\WalletTransactionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class WalletController extends Controller
{
    public function show(Request $request, WalletService $wallets): WalletSummaryResource
    {
        return WalletSummaryResource::make($wallets->summary($this->rider($request)));
    }

    /** Newest first, filterable by type and by a date range (Philippine days). */
    public function transactions(ListWalletTransactionsRequest $request): AnonymousResourceCollection
    {
        $transactions = Wallet::forRider($this->rider($request))
            ->transactions()
            ->with(['booking', 'topupRequest'])
            ->when($request->type(), fn ($query, $type) => $query->where('type', $type))
            ->when($request->from(), fn ($query, $from) => $query->where('created_at', '>=', $from))
            ->when($request->to(), fn ($query, $to) => $query->where('created_at', '<=', $to))
            ->latest('id')
            ->paginate($request->perPage());

        return WalletTransactionResource::collection($transactions);
    }

    public function storeTopup(CreateTopupRequest $request, CreateTopupRequestAction $createTopup): JsonResponse
    {
        $topup = $createTopup->handle($this->rider($request), $request->amount(), $request->returnUrl());

        return TopupRequestResource::make($topup)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    /** Polled by the app after checkout; only the owner may read it. */
    public function showTopup(Request $request, TopupRequest $topup): TopupRequestResource
    {
        abort_unless($topup->wallet->user_id === $this->rider($request)->id, Response::HTTP_NOT_FOUND);

        return TopupRequestResource::make($topup);
    }

    private function rider(Request $request): User
    {
        /** @var User $user role:rider middleware guarantees a rider here */
        $user = $request->user();

        return $user;
    }
}
