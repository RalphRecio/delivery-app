<?php

declare(strict_types=1);

namespace App\Domain\Payment\Data;

/** The gateway's answer: where to send the rider, and ids to match webhooks against. */
final readonly class CheckoutSessionData
{
    public function __construct(
        public string $sessionId,
        public string $checkoutUrl,
        public ?string $paymentIntentId,
    ) {}
}
