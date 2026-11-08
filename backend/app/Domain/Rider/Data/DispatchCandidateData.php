<?php

declare(strict_types=1);

namespace App\Domain\Rider\Data;

use App\Domain\Auth\Models\User;
use App\Domain\Shared\ValueObjects\Money;
use Carbon\CarbonImmutable;

/**
 * A rider as the dispatcher sees them for one booking: whether they are on
 * duty, how far they are from the pickup and, if they cannot take it, why not.
 * Being off duty does not make a rider unavailable: the dispatcher may still
 * assign them (typically after a phone call).
 */
final readonly class DispatchCandidateData
{
    public function __construct(
        public User $rider,
        public bool $isOnDuty,
        public ?int $distanceToPickupMeters,
        public ?CarbonImmutable $locationUpdatedAt,
        public ?string $activeJobReference,
        public Money $walletBalance,
        /** Null while the wallet is switched off: balance does not matter then. */
        public ?Money $minimumBalance,
    ) {}

    public function isAvailable(): bool
    {
        return $this->unavailableReason() === null;
    }

    /** The same rules a rider meets when accepting a job themselves. */
    public function unavailableReason(): ?string
    {
        if ($this->activeJobReference !== null) {
            return "On job {$this->activeJobReference}";
        }

        if ($this->minimumBalance !== null && $this->walletBalance->isLessThan($this->minimumBalance)) {
            return "Wallet {$this->walletBalance->format()} is below the {$this->minimumBalance->format()} minimum";
        }

        return null;
    }
}
