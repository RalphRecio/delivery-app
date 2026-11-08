<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Models;

use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Enums\WalletTransactionType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * One ledger line. Append-only: the model refuses updates and deletes, and a
 * database trigger refuses them too. Created only by WalletService.
 *
 * @property int $id
 * @property int $wallet_id
 * @property WalletTransactionType $type
 * @property int $amount_centavos Signed: credits positive, debits negative
 * @property int|null $booking_id
 * @property int|null $topup_request_id
 * @property string|null $reason
 * @property int|null $created_by
 * @property CarbonImmutable $created_at
 * @property-read Booking|null $booking
 * @property-read TopupRequest|null $topupRequest
 */
#[Fillable(['wallet_id', 'type', 'amount_centavos', 'booking_id', 'topup_request_id', 'reason', 'created_by'])]
final class WalletTransaction extends Model
{
    public const null UPDATED_AT = null;

    protected static function booted(): void
    {
        self::updating(static fn () => throw new LogicException('Wallet transactions are append-only.'));
        self::deleting(static fn () => throw new LogicException('Wallet transactions are append-only.'));
    }

    public function amount(): Money
    {
        return Money::fromCentavos($this->amount_centavos);
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /** @return BelongsTo<TopupRequest, $this> */
    public function topupRequest(): BelongsTo
    {
        return $this->belongsTo(TopupRequest::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => WalletTransactionType::class,
            'amount_centavos' => 'integer',
            'created_at' => 'immutable_datetime',
        ];
    }
}
