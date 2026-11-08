<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Wallet\Models\WalletTransaction;
use Illuminate\Http\Request;

/**
 * One ledger line as the rider sees it, with what it relates to.
 *
 * @mixin WalletTransaction
 */
final class WalletTransactionResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'amount' => $this->amount(),
            'reason' => $this->reason,
            'booking' => $this->booking === null ? null : [
                'id' => $this->booking->id,
                'reference' => $this->booking->reference,
                'service_type' => $this->booking->service_type->value,
                'total_fare' => $this->booking->totalFare(),
                'commission_rate_bps' => $this->booking->commission_rate_bps,
            ],
            'topup' => $this->topupRequest === null ? null : [
                'id' => $this->topupRequest->id,
                'reference' => $this->topupRequest->reference(),
                'gateway' => $this->topupRequest->gateway,
            ],
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
