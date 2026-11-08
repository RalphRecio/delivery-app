<?php

declare(strict_types=1);

namespace App\Domain\Payment\Gateways;

use App\Domain\Payment\Contracts\PaymentGateway;
use App\Domain\Payment\Data\CheckoutRequestData;
use App\Domain\Payment\Data\CheckoutSessionData;
use App\Domain\Payment\Data\PaymentWebhookEventData;
use App\Domain\Payment\Enums\PaymentWebhookEventType;
use App\Domain\Payment\Exceptions\InvalidWebhookSignatureException;
use App\Domain\Payment\Exceptions\PaymentGatewayUnavailableException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpClient;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;

/**
 * PayMongo Checkout for GCash and Maya.
 *
 * Webhooks carry `Paymongo-Signature: t=<timestamp>,te=<test sig>,li=<live sig>`
 * where each signature is HMAC-SHA256 of "<timestamp>.<raw body>" with the
 * webhook secret. We compare against `te` in test mode and `li` in live mode.
 */
final readonly class PayMongoGateway implements PaymentGateway
{
    private const array PAYMENT_METHODS = ['gcash', 'paymaya'];

    private const int TIMEOUT_SECONDS = 15;

    public function __construct(
        private HttpClient $http,
        private string $secretKey,
        private string $webhookSecret,
        private string $baseUrl,
        private bool $isLiveMode,
    ) {}

    public function name(): string
    {
        return 'paymongo';
    }

    public function createCheckout(CheckoutRequestData $data): CheckoutSessionData
    {
        try {
            $response = $this->http
                ->baseUrl($this->baseUrl)
                ->withBasicAuth($this->secretKey, '')
                ->acceptJson()
                ->timeout(self::TIMEOUT_SECONDS)
                ->post('/checkout_sessions', [
                    'data' => [
                        'attributes' => [
                            'line_items' => [[
                                'name' => $data->description,
                                'quantity' => 1,
                                'amount' => $data->amount->centavos,
                                'currency' => 'PHP',
                            ]],
                            'payment_method_types' => self::PAYMENT_METHODS,
                            'reference_number' => $data->referenceNumber,
                            'description' => $data->description,
                            'success_url' => $data->returnUrl,
                            'cancel_url' => $data->returnUrl,
                            'send_email_receipt' => false,
                            'show_line_items' => true,
                            'metadata' => $data->metadata,
                        ],
                    ],
                ])
                ->throw();
        } catch (ConnectionException|RequestException $exception) {
            Log::error('PayMongo checkout failed', ['reference' => $data->referenceNumber, 'exception' => $exception]);

            throw new PaymentGatewayUnavailableException($exception);
        }

        $sessionId = $response->json('data.id');
        $checkoutUrl = $response->json('data.attributes.checkout_url');

        if (! is_string($sessionId) || ! is_string($checkoutUrl)) {
            Log::error('PayMongo checkout returned an unexpected body', ['reference' => $data->referenceNumber]);

            throw new PaymentGatewayUnavailableException;
        }

        $paymentIntentId = $response->json('data.attributes.payment_intent.id');

        return new CheckoutSessionData(
            sessionId: $sessionId,
            checkoutUrl: $checkoutUrl,
            paymentIntentId: is_string($paymentIntentId) ? $paymentIntentId : null,
        );
    }

    public function parseWebhook(string $rawBody, ?string $signatureHeader): PaymentWebhookEventData
    {
        $this->verifySignature($rawBody, $signatureHeader);

        $payload = json_decode($rawBody, true);

        if (! is_array($payload)) {
            throw new InvalidWebhookSignatureException;
        }

        /** @var array<string, mixed> $event */
        $event = data_get($payload, 'data.attributes', []);
        $type = data_get($event, 'type');

        return match ($type) {
            'checkout_session.payment.paid' => new PaymentWebhookEventData(
                type: PaymentWebhookEventType::CheckoutPaid,
                checkoutSessionId: self::stringOrNull(data_get($event, 'data.id')),
                paymentIntentId: self::stringOrNull(data_get($event, 'data.attributes.payment_intent.id')),
                paymentId: self::stringOrNull(data_get($event, 'data.attributes.payments.0.id')),
                amountCentavos: self::intOrNull(data_get($event, 'data.attributes.payments.0.attributes.amount')),
            ),
            'payment.failed' => new PaymentWebhookEventData(
                type: PaymentWebhookEventType::PaymentFailed,
                paymentIntentId: self::stringOrNull(data_get($event, 'data.attributes.payment_intent_id')),
                paymentId: self::stringOrNull(data_get($event, 'data.id')),
                failureReason: self::stringOrNull(data_get($event, 'data.attributes.failed_message'))
                    ?? self::stringOrNull(data_get($event, 'data.attributes.failed_code')),
            ),
            default => new PaymentWebhookEventData(type: PaymentWebhookEventType::Other),
        };
    }

    private function verifySignature(string $rawBody, ?string $header): void
    {
        if ($header === null || $header === '' || $this->webhookSecret === '') {
            throw new InvalidWebhookSignatureException;
        }

        $parts = [];

        foreach (explode(',', $header) as $pair) {
            [$key, $value] = array_pad(explode('=', trim($pair), 2), 2, '');
            $parts[$key] = $value;
        }

        $timestamp = $parts['t'] ?? '';
        $given = $this->isLiveMode ? ($parts['li'] ?? '') : ($parts['te'] ?? '');

        if ($timestamp === '' || $given === '') {
            throw new InvalidWebhookSignatureException;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$rawBody, $this->webhookSecret);

        if (! hash_equals($expected, $given)) {
            throw new InvalidWebhookSignatureException;
        }
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }

    private static function intOrNull(mixed $value): ?int
    {
        return is_int($value) ? $value : null;
    }
}
