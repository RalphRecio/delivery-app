<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Wallet\Models\TopupRequest;
use Illuminate\Http\Request;

/**
 * @mixin TopupRequest
 */
final class TopupRequestResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'reference' => $this->reference(),
            'checkout_url' => $this->status->value === 'pending' ? $this->checkout_url : null,
            'failure_reason' => $this->failure_reason,
            'expires_at' => $this->expires_at->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
