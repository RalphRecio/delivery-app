<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Data;

use App\Domain\Shared\ValueObjects\Money;

/** What the rider's wallet screen shows. */
final readonly class WalletSummaryData
{
    public function __construct(
        public Money $balance,
        public Money $minimumBalance,
        public Money $topupMin,
        public Money $topupMax,
    ) {}

    public function canAcceptBookings(): bool
    {
        return ! $this->balance->isLessThan($this->minimumBalance);
    }

    /** How much more the rider needs to accept jobs; zero when they already can. */
    public function shortfall(): Money
    {
        return $this->canAcceptBookings() ? Money::zero() : $this->minimumBalance->subtract($this->balance);
    }
}
