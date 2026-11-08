<?php

declare(strict_types=1);

namespace App\Domain\Payment\Data;

use App\Domain\Shared\ValueObjects\Money;

/** What we ask the gateway to collect. */
final readonly class CheckoutRequestData
{
    public function __construct(
        public Money $amount,
        /** Our own reference, e.g. "TOPUP-42"; shown in the gateway dashboard. */
        public string $referenceNumber,
        public string $description,
        /** Where the gateway sends the rider after paying or cancelling. Never trusted to credit. */
        public string $returnUrl,
        /** @var array<string, string> */
        public array $metadata = [],
    ) {}
}
