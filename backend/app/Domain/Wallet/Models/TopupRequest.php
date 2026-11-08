<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Models;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Enums\TopupStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A rider's request to add funds. Becomes a wallet transaction only when
 * the gateway webhook confirms the payment.
 *
 * @property int $id
 * @property int $wallet_id
 * @property int $amount_centavos
 * @property TopupStatus $status
 * @property string $gateway
 * @property string|null $checkout_session_id
 * @property string|null $payment_intent_id
 * @property string|null $gateway_payment_id
 * @property string|null $checkout_url
 * @property string|null $failure_reason
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $paid_at
 * @property CarbonImmutable|null $failed_at
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read Wallet $wallet
 */
#[Fillable(['wallet_id', 'amount_centavos', 'status', 'gateway', 'checkout_session_id', 'payment_intent_id', 'gateway_payment_id', 'checkout_url', 'failure_reason', 'expires_at', 'paid_at', 'failed_at'])]
final class TopupRequest extends Model
{
    public function amount(): Money
    {
        return Money::fromCentavos($this->amount_centavos);
    }

    /** @return BelongsTo<Wallet, $this> */
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    /** The reference shown to riders and support: the gateway's once paid, ours before. */
    public function reference(): string
    {
        return $this->gateway_payment_id ?? 'TOPUP-'.$this->id;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TopupStatus::class,
            'amount_centavos' => 'integer',
            'expires_at' => 'immutable_datetime',
            'paid_at' => 'immutable_datetime',
            'failed_at' => 'immutable_datetime',
        ];
    }
}
