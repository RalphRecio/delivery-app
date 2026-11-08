<?php

declare(strict_types=1);

namespace App\Domain\Payment\Enums;

enum PaymentWebhookEventType: string
{
    case CheckoutPaid = 'checkout_paid';
    case PaymentFailed = 'payment_failed';
    /** Anything else the gateway sends; acknowledged and ignored. */
    case Other = 'other';
}
