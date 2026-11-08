<?php

declare(strict_types=1);

namespace App\Domain\Payment\Data;

use App\Domain\Payment\Enums\PaymentWebhookEventType;

/** A verified webhook, reduced to what the wallet needs. */
final readonly class PaymentWebhookEventData
{
    public function __construct(
        public PaymentWebhookEventType $type,
        public ?string $checkoutSessionId = null,
        public ?string $paymentIntentId = null,
        /** The gateway's payment reference; the duplicate-crediting guard keys on it. */
        public ?string $paymentId = null,
        public ?int $amountCentavos = null,
        public ?string $failureReason = null,
    ) {}
}
