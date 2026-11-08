<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Wallet\Data\WalletSummaryData;
use Illuminate\Http\Request;

/**
 * @property-read WalletSummaryData $resource
 */
final class WalletSummaryResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'balance' => $this->resource->balance,
            'minimum_balance' => $this->resource->minimumBalance,
            'can_accept_bookings' => $this->resource->canAcceptBookings(),
            'shortfall' => $this->resource->shortfall(),
            'topup_limits' => [
                'min' => $this->resource->topupMin,
                'max' => $this->resource->topupMax,
            ],
        ];
    }
}
