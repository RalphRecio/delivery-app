<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
 * Feature tests boot the application and get a fresh PostgreSQL schema
 * (wrapped in a transaction per test). Unit tests stay framework-free.
 */
pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/** Credits a rider's wallet the way support would (an adjustment), so they can accept jobs. */
function fundWallet(User $rider, string $pesos = '500'): void
{
    app(WalletService::class)->adjust($rider, Money::fromPesos($pesos), 'Test funds', null);
}

const TEST_PAYMONGO_WEBHOOK_SECRET = 'whsk_test_secret';

/**
 * Posts a PayMongo webhook signed exactly as PayMongo signs it:
 * HMAC-SHA256 of "<timestamp>.<raw body>" in the `te` (test mode) slot.
 *
 * @param  array<string, mixed>  $event  the event's `attributes` (type + data)
 */
function postPayMongoWebhook(array $event, ?string $signature = null): Illuminate\Testing\TestResponse
{
    config(['services.paymongo.webhook_secret' => TEST_PAYMONGO_WEBHOOK_SECRET, 'services.paymongo.live_mode' => false]);

    $body = (string) json_encode(['data' => ['id' => 'evt_'.uniqid(), 'type' => 'event', 'attributes' => $event]]);
    $timestamp = (string) time();
    $signature ??= hash_hmac('sha256', $timestamp.'.'.$body, TEST_PAYMONGO_WEBHOOK_SECRET);

    return test()->call('POST', '/api/v1/webhooks/paymongo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => "t={$timestamp},te={$signature},li=",
    ], $body);
}

/** @return array<string, mixed> */
function paidCheckoutEvent(string $sessionId, string $paymentId, int $amountCentavos): array
{
    return [
        'type' => 'checkout_session.payment.paid',
        'livemode' => false,
        'data' => [
            'id' => $sessionId,
            'type' => 'checkout_session',
            'attributes' => [
                'payment_intent' => ['id' => 'pi_for_'.$sessionId],
                'payments' => [['id' => $paymentId, 'type' => 'payment', 'attributes' => ['amount' => $amountCentavos, 'status' => 'paid']]],
            ],
        ],
    ];
}

/** @return array<string, mixed> */
function failedPaymentEvent(string $paymentIntentId, string $message = 'Insufficient balance'): array
{
    return [
        'type' => 'payment.failed',
        'livemode' => false,
        'data' => [
            'id' => 'pay_failed_'.uniqid(),
            'type' => 'payment',
            'attributes' => ['payment_intent_id' => $paymentIntentId, 'status' => 'failed', 'failed_message' => $message],
        ],
    ];
}

/**
 * Fakes PayMongo's checkout endpoint. The first session in a test is
 * $sessionId; any further ones get "-2", "-3"... so ids stay unique, as they
 * are at PayMongo. (Http::fake keeps the first stub registered in a test.)
 */
function fakePayMongoCheckout(string $sessionId = 'cs_test_1'): void
{
    $issued = 0;

    Illuminate\Support\Facades\Http::fake([
        '*/checkout_sessions' => function () use ($sessionId, &$issued) {
            $issued++;
            $id = $issued === 1 ? $sessionId : "{$sessionId}-{$issued}";

            return Illuminate\Support\Facades\Http::response([
                'data' => [
                    'id' => $id,
                    'type' => 'checkout_session',
                    'attributes' => [
                        'checkout_url' => "https://checkout.paymongo.com/{$id}",
                        'payment_intent' => ['id' => 'pi_for_'.$id],
                    ],
                ],
            ]);
        },
    ]);
}
