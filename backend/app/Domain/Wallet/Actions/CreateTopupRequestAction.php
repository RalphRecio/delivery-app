<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Payment\Contracts\PaymentGateway;
use App\Domain\Payment\Data\CheckoutRequestData;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Data\WalletSettings;
use App\Domain\Wallet\Enums\TopupStatus;
use App\Domain\Wallet\Models\TopupRequest;
use App\Domain\Wallet\Models\Wallet;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Starts a top-up: records a pending request, then opens a gateway checkout
 * for it. Nothing is credited here; only the gateway webhook does that.
 */
final readonly class CreateTopupRequestAction
{
    public function __construct(
        private PaymentGateway $gateway,
        private WalletSettings $settings,
    ) {}

    public function handle(User $rider, Money $amount, string $returnUrl): TopupRequest
    {
        $wallet = Wallet::forRider($rider);

        $request = TopupRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount_centavos' => $amount->centavos,
            'status' => TopupStatus::Pending,
            'gateway' => $this->gateway->name(),
            'expires_at' => Date::now()->addMinutes($this->settings->topupExpiryMinutes),
        ]);

        try {
            $session = $this->gateway->createCheckout(new CheckoutRequestData(
                amount: $amount,
                referenceNumber: $request->reference(),
                description: 'Rider wallet top-up',
                returnUrl: self::withTopupId($returnUrl, $request->id),
                metadata: ['topup_request_id' => (string) $request->id, 'user_id' => (string) $rider->id],
            ));
        } catch (Throwable $exception) {
            // The rider never reached checkout; mark it so it does not linger as pending.
            $request->forceFill([
                'status' => TopupStatus::Failed,
                'failed_at' => Date::now(),
                'failure_reason' => 'Could not open the payment page.',
            ])->save();

            throw $exception;
        }

        $request->forceFill([
            'checkout_session_id' => $session->sessionId,
            'payment_intent_id' => $session->paymentIntentId,
            'checkout_url' => $session->checkoutUrl,
        ])->save();

        Log::info('Top-up started', ['user_id' => $rider->id, 'topup_request_id' => $request->id, 'amount_centavos' => $amount->centavos]);

        return $request->refresh();
    }

    /** The app lands back on its status screen, which polls this request. */
    private static function withTopupId(string $url, int $id): string
    {
        return $url.(str_contains($url, '?') ? '&' : '?').'topup_request_id='.$id;
    }
}
