<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Services;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Data\WalletSettings;
use App\Domain\Wallet\Data\WalletSummaryData;
use App\Domain\Wallet\Enums\TopupStatus;
use App\Domain\Wallet\Enums\WalletTransactionType;
use App\Domain\Wallet\Exceptions\InsufficientWalletBalanceException;
use App\Domain\Wallet\Models\TopupRequest;
use App\Domain\Wallet\Models\Wallet;
use App\Domain\Wallet\Models\WalletTransaction;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * All wallet balance logic lives here.
 *
 * - The balance is the sum of the ledger; nothing stores it.
 * - Every write runs in a transaction that first locks the wallet row
 *   (SELECT ... FOR UPDATE), so concurrent writes to one wallet queue up.
 * - Writes are idempotent: a booking gets at most one commission and one
 *   refund, a top-up is credited at most once (unique constraints back this).
 *
 * Lock order is always booking (by the caller), then topup request, then
 * wallet, so two code paths can never wait on each other in reverse.
 */
final readonly class WalletService
{
    public function __construct(
        private WalletSettings $settings,
    ) {}

    public function walletFor(User $rider): Wallet
    {
        return Wallet::forRider($rider);
    }

    public function balance(Wallet $wallet): Money
    {
        return Money::fromCentavos((int) $wallet->transactions()->sum('amount_centavos'));
    }

    public function summary(User $rider): WalletSummaryData
    {
        return new WalletSummaryData(
            balance: $this->balance($this->walletFor($rider)),
            minimumBalance: $this->settings->minimumBalance,
            topupMin: $this->settings->topupMin,
            topupMax: $this->settings->topupMax,
        );
    }

    /** @throws InsufficientWalletBalanceException */
    public function assertCanAcceptBookings(User $rider): void
    {
        if (! $this->settings->enabled) {
            return;
        }

        $summary = $this->summary($rider);

        if (! $summary->canAcceptBookings()) {
            throw new InsufficientWalletBalanceException($summary->balance, $summary->minimumBalance);
        }
    }

    /**
     * The platform's cut of a completed cash booking: -(fare × rate). The fare
     * (base + distance + service fee) never includes Pabili item cost, which
     * the rider advanced and the customer repays on delivery.
     */
    public function chargeCommission(Booking $booking): ?WalletTransaction
    {
        if (! $this->settings->enabled || $booking->rider_id === null || ! $booking->payment_method->isCollectedByRider()) {
            return null;
        }

        $commission = $booking->totalFare()->percentage($booking->commission_rate_bps ?? 0);

        if ($commission->isZero()) {
            return null;
        }

        return DB::transaction(function () use ($booking, $commission): ?WalletTransaction {
            $wallet = $this->lockWalletOf($booking->rider_id);

            if ($this->hasEntry($booking, WalletTransactionType::Commission)) {
                return null;
            }

            $transaction = $this->record($wallet, WalletTransactionType::Commission, $commission->multiply(-1), bookingId: $booking->id);

            Log::info('Commission charged', ['booking_id' => $booking->id, 'user_id' => $booking->rider_id, 'amount_centavos' => $transaction->amount_centavos]);

            return $transaction;
        });
    }

    /** Gives a booking's commission back, once, if one was charged. */
    public function refundCommission(Booking $booking, string $reason, ?User $actor): ?WalletTransaction
    {
        if ($booking->rider_id === null) {
            return null;
        }

        return DB::transaction(function () use ($booking, $reason, $actor): ?WalletTransaction {
            $wallet = $this->lockWalletOf($booking->rider_id);

            $commission = WalletTransaction::query()
                ->where('booking_id', $booking->id)
                ->where('type', WalletTransactionType::Commission)
                ->first();

            if ($commission === null || $this->hasEntry($booking, WalletTransactionType::Refund)) {
                return null;
            }

            $transaction = $this->record(
                $wallet,
                WalletTransactionType::Refund,
                $commission->amount()->multiply(-1),
                bookingId: $booking->id,
                reason: $reason,
                createdBy: $actor?->id,
            );

            Log::info('Commission refunded', ['booking_id' => $booking->id, 'user_id' => $booking->rider_id, 'amount_centavos' => $transaction->amount_centavos]);

            return $transaction;
        });
    }

    /**
     * Credits a confirmed top-up exactly once. Repeated webhooks for the same
     * payment, or a second payment reference for an already-paid request,
     * change nothing.
     */
    public function creditTopup(TopupRequest $request, string $gatewayPaymentId): ?WalletTransaction
    {
        return DB::transaction(function () use ($request, $gatewayPaymentId): ?WalletTransaction {
            $locked = TopupRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();

            if (! $locked->status->canBecomePaid()) {
                return null;
            }

            $wallet = Wallet::query()->whereKey($locked->wallet_id)->lockForUpdate()->firstOrFail();

            $locked->forceFill([
                'status' => TopupStatus::Paid,
                'gateway_payment_id' => $gatewayPaymentId,
                'paid_at' => Date::now(),
                'failure_reason' => null,
            ])->save();

            $transaction = $this->record($wallet, WalletTransactionType::Topup, $locked->amount(), topupRequestId: $locked->id);

            Log::info('Top-up credited', ['user_id' => $wallet->user_id, 'topup_request_id' => $locked->id, 'amount_centavos' => $locked->amount_centavos]);

            return $transaction;
        });
    }

    /** A manual correction; the reason is mandatory and stays on the ledger. */
    public function adjust(User $rider, Money $amount, string $reason, ?User $actor): WalletTransaction
    {
        if ($amount->isZero()) {
            throw new InvalidArgumentException('An adjustment cannot be zero.');
        }

        if (trim($reason) === '') {
            throw new InvalidArgumentException('An adjustment needs a reason.');
        }

        return DB::transaction(function () use ($rider, $amount, $reason, $actor): WalletTransaction {
            $wallet = $this->lockWalletOf($rider->id);

            $transaction = $this->record($wallet, WalletTransactionType::Adjustment, $amount, reason: trim($reason), createdBy: $actor?->id);

            Log::info('Wallet adjusted', ['user_id' => $rider->id, 'amount_centavos' => $amount->centavos, 'actor_id' => $actor?->id]);

            return $transaction;
        });
    }

    private function lockWalletOf(int $riderId): Wallet
    {
        // Created outside the lock if missing (first use), then locked.
        Wallet::query()->firstOrCreate(['user_id' => $riderId]);

        return Wallet::query()->where('user_id', $riderId)->lockForUpdate()->firstOrFail();
    }

    private function hasEntry(Booking $booking, WalletTransactionType $type): bool
    {
        return WalletTransaction::query()->where('booking_id', $booking->id)->where('type', $type)->exists();
    }

    private function record(
        Wallet $wallet,
        WalletTransactionType $type,
        Money $amount,
        ?int $bookingId = null,
        ?int $topupRequestId = null,
        ?string $reason = null,
        ?int $createdBy = null,
    ): WalletTransaction {
        return WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => $type,
            'amount_centavos' => $amount->centavos,
            'booking_id' => $bookingId,
            'topup_request_id' => $topupRequestId,
            'reason' => $reason,
            'created_by' => $createdBy,
        ]);
    }
}
