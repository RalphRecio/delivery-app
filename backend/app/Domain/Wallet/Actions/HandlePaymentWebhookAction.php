<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Actions;

use App\Domain\Payment\Data\PaymentWebhookEventData;
use App\Domain\Payment\Enums\PaymentWebhookEventType;
use App\Domain\Wallet\Enums\TopupStatus;
use App\Domain\Wallet\Models\TopupRequest;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Log;

/**
 * Applies a verified gateway event to its top-up. Safe to run any number of
 * times for the same event: the gateway retries, and duplicates are no-ops.
 */
final readonly class HandlePaymentWebhookAction
{
    public function __construct(
        private WalletService $wallets,
    ) {}

    public function handle(PaymentWebhookEventData $event): void
    {
        match ($event->type) {
            PaymentWebhookEventType::CheckoutPaid => $this->paid($event),
            PaymentWebhookEventType::PaymentFailed => $this->failed($event),
            PaymentWebhookEventType::Other => null,
        };
    }

    private function paid(PaymentWebhookEventData $event): void
    {
        $request = $event->checkoutSessionId === null
            ? null
            : TopupRequest::query()->where('checkout_session_id', $event->checkoutSessionId)->first();

        if ($request === null || $event->paymentId === null) {
            Log::warning('Paid webhook for an unknown top-up', ['checkout_session_id' => $event->checkoutSessionId]);

            return;
        }

        // Never credit more (or less) than the rider asked for and was charged.
        if ($event->amountCentavos !== null && $event->amountCentavos !== $request->amount_centavos) {
            Log::error('Top-up amount mismatch; not credited', [
                'topup_request_id' => $request->id,
                'expected_centavos' => $request->amount_centavos,
                'paid_centavos' => $event->amountCentavos,
            ]);

            return;
        }

        $this->wallets->creditTopup($request, $event->paymentId);
    }

    private function failed(PaymentWebhookEventData $event): void
    {
        if ($event->paymentIntentId === null) {
            return;
        }

        // Only a pending request turns failed; a paid one stays paid.
        $updated = TopupRequest::query()
            ->where('payment_intent_id', $event->paymentIntentId)
            ->where('status', TopupStatus::Pending)
            ->update([
                'status' => TopupStatus::Failed,
                'failed_at' => Date::now(),
                'failure_reason' => $event->failureReason ?? 'The payment did not go through.',
                'updated_at' => Date::now(),
            ]);

        Log::info('Top-up payment failed', ['payment_intent_id' => $event->paymentIntentId, 'updated' => $updated]);
    }
}
