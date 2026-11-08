<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum WalletTransactionType: string
{
    /** Rider added funds through GCash or Maya (positive). */
    case Topup = 'topup';

    /** Platform cut when a cash booking completes (negative). */
    case Commission = 'commission';

    /** A commission given back after support cancels a completed booking (positive). */
    case Refund = 'refund';

    /** Manual correction with a required reason (either sign). */
    case Adjustment = 'adjustment';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $type) => $type->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Topup => 'Top-up',
            self::Commission => 'Commission',
            self::Refund => 'Commission refund',
            self::Adjustment => 'Adjustment',
        };
    }
}
