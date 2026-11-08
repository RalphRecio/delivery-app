<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Data;

use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Contracts\Config\Repository;

/** Typed view of config/wallet.php. */
final readonly class WalletSettings
{
    public function __construct(
        /** Off: no minimum balance to accept jobs and no commission charged. */
        public bool $enabled,
        public Money $minimumBalance,
        public Money $topupMin,
        public Money $topupMax,
        public int $topupExpiryMinutes,
    ) {}

    public static function fromConfig(Repository $config): self
    {
        return new self(
            enabled: (bool) $config->get('wallet.enabled'),
            minimumBalance: Money::fromCentavos((int) $config->get('wallet.minimum_balance_centavos')),
            topupMin: Money::fromCentavos((int) $config->get('wallet.topup_min_centavos')),
            topupMax: Money::fromCentavos((int) $config->get('wallet.topup_max_centavos')),
            topupExpiryMinutes: (int) $config->get('wallet.topup_expiry_minutes'),
        );
    }
}
