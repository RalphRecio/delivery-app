<?php

declare(strict_types=1);

namespace App\Domain\Payment\Contracts;

use App\Domain\Payment\Data\CheckoutRequestData;
use App\Domain\Payment\Data\CheckoutSessionData;
use App\Domain\Payment\Data\PaymentWebhookEventData;
use App\Domain\Payment\Exceptions\InvalidWebhookSignatureException;
use App\Domain\Payment\Exceptions\PaymentGatewayUnavailableException;

/**
 * The boundary to the payment provider (PayMongo today). The wallet only
 * talks to this, so the provider can be swapped or faked in tests.
 */
interface PaymentGateway
{
    public function name(): string;

    /**
     * Starts a hosted checkout (GCash or Maya) and returns where to send the rider.
     *
     * @throws PaymentGatewayUnavailableException
     */
    public function createCheckout(CheckoutRequestData $data): CheckoutSessionData;

    /**
     * Verifies the signature over the raw body and maps the event.
     *
     * @throws InvalidWebhookSignatureException
     */
    public function parseWebhook(string $rawBody, ?string $signatureHeader): PaymentWebhookEventData;
}
