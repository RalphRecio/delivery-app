<?php

declare(strict_types=1);

namespace App\Domain\Booking\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Support\Facades\DB;

/**
 * Support may cancel at any point, including while the rider is on the way
 * (customers cannot) and after completion (a dispute). Cancelling a completed
 * booking refunds its commission to the rider in the same transaction. The
 * reason is mandatory so the history explains itself later.
 */
final readonly class CancelBookingAsSupportAction
{
    public function __construct(
        private TransitionBookingStatusAction $transition,
        private WalletService $wallets,
    ) {}

    public function handle(User $admin, Booking $booking, string $reason): Booking
    {
        return DB::transaction(function () use ($admin, $booking, $reason): Booking {
            $cancelled = $this->transition->handle($booking, BookingStatus::Cancelled, $admin, $reason, isSupportOverride: true);

            // A no-op unless a commission was charged, i.e. the booking had been completed.
            $this->wallets->refundCommission($cancelled, "Booking {$cancelled->reference} cancelled by support: {$reason}", $admin);

            return $cancelled;
        });
    }
}
