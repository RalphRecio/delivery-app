<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum TopupStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case Expired = 'expired';

    /**
     * Paid is final. Failed and expired are not: PayMongo lets a customer
     * retry inside the same checkout, and a payment can land after our own
     * expiry, so a confirmed payment always wins.
     */
    public function canBecomePaid(): bool
    {
        return $this !== self::Paid;
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Waiting for payment',
            self::Paid => 'Paid',
            self::Failed => 'Payment failed',
            self::Expired => 'Expired',
        };
    }
}
