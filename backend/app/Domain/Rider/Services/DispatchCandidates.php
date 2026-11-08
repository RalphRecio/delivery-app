<?php

declare(strict_types=1);

namespace App\Domain\Rider\Services;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Data\DispatchCandidateData;
use App\Domain\Rider\Data\MatchingSettings;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Data\WalletSettings;
use App\Domain\Wallet\Models\WalletTransaction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Date;

/**
 * Riders a dispatcher may assign to a booking: every rider with an active
 * account, each with whether they are on duty (online with a recent
 * heartbeat, the same rule as RiderAvailability), their distance to the
 * pickup, current job and wallet balance.
 *
 * Off-duty riders are included because dispatchers phone riders to take a
 * job; the job then waits in the rider app for when they open it. Busy and
 * low-balance riders are listed too, marked unavailable, so the dispatcher
 * sees the whole picture rather than an unexplained short list.
 */
final readonly class DispatchCandidates
{
    public function __construct(
        private MatchingSettings $matching,
        private WalletSettings $wallet,
    ) {}

    /**
     * Available riders first, then on-duty before off-duty, then nearest
     * first; riders without a known position last.
     *
     * @return list<DispatchCandidateData>
     */
    public function forBooking(Booking $booking): array
    {
        $candidates = $this->query($booking)->get()->map($this->toData(...))->all();

        usort($candidates, static fn (DispatchCandidateData $a, DispatchCandidateData $b): int => [
            $a->isAvailable() ? 0 : 1,
            $a->isOnDuty ? 0 : 1,
            $a->distanceToPickupMeters ?? PHP_INT_MAX,
            $a->rider->name,
        ] <=> [
            $b->isAvailable() ? 0 : 1,
            $b->isOnDuty ? 0 : 1,
            $b->distanceToPickupMeters ?? PHP_INT_MAX,
            $b->rider->name,
        ]);

        return $candidates;
    }

    /** Null when the user is not an active rider. */
    public function find(Booking $booking, int $riderId): ?DispatchCandidateData
    {
        $rider = $this->query($booking)->whereKey($riderId)->first();

        return $rider === null ? null : $this->toData($rider);
    }

    /**
     * @return Builder<User>
     */
    private function query(Booking $booking): Builder
    {
        $activeStatuses = array_map(
            static fn (BookingStatus $status) => $status->value,
            [BookingStatus::Accepted, BookingStatus::PickingUp, BookingStatus::InTransit],
        );

        // Left join: a rider who never opened the app may have no profile row yet.
        return User::query()
            ->leftJoin('rider_profiles', 'rider_profiles.user_id', '=', 'users.id')
            ->where('users.role', UserRole::Rider)
            ->whereNull('users.deactivated_at')
            ->select('users.*', 'rider_profiles.location_updated_at as rider_location_updated_at')
            ->selectRaw(
                'COALESCE(rider_profiles.is_online AND rider_profiles.last_seen_at >= ?, false) AS is_on_duty',
                [Date::now()->subSeconds($this->matching->presenceTimeoutSeconds)],
            )
            // ST_Distance is NULL when the rider has not shared a position yet.
            ->selectRaw(
                'ROUND(ST_Distance(rider_profiles.current_location, ST_GeogFromText(?)))::int AS distance_to_pickup_meters',
                [$booking->pickup_location->toEwkt()],
            )
            ->addSelect([
                'active_job_reference' => Booking::query()
                    ->select('reference')
                    ->whereColumn('rider_id', 'users.id')
                    ->whereIn('status', $activeStatuses)
                    ->limit(1),
                // The ledger is the balance (ADR 0015): sum it, never read a stored figure.
                'wallet_balance_centavos' => WalletTransaction::query()
                    ->selectRaw('COALESCE(SUM(wallet_transactions.amount_centavos), 0)')
                    ->join('wallets', 'wallets.id', '=', 'wallet_transactions.wallet_id')
                    ->whereColumn('wallets.user_id', 'users.id'),
            ]);
    }

    private function toData(User $rider): DispatchCandidateData
    {
        $distance = $rider->getAttribute('distance_to_pickup_meters');
        $locationUpdatedAt = $rider->getAttribute('rider_location_updated_at');
        $activeJob = $rider->getAttribute('active_job_reference');

        return new DispatchCandidateData(
            rider: $rider,
            isOnDuty: (bool) $rider->getAttribute('is_on_duty'),
            distanceToPickupMeters: $distance === null ? null : (int) $distance,
            locationUpdatedAt: $locationUpdatedAt === null ? null : CarbonImmutable::parse((string) $locationUpdatedAt),
            activeJobReference: $activeJob === null ? null : (string) $activeJob,
            walletBalance: Money::fromCentavos((int) $rider->getAttribute('wallet_balance_centavos')),
            minimumBalance: $this->wallet->enabled ? $this->wallet->minimumBalance : null,
        );
    }
}
