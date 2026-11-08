<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Wallet\Enums\TopupStatus;
use App\Domain\Wallet\Enums\WalletTransactionType;
use App\Domain\Wallet\Models\TopupRequest;
use App\Domain\Wallet\Models\Wallet;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->rider = User::factory()->rider()->create();
    Sanctum::actingAs($this->rider);
});

function startTopup(string $amount = '500', string $sessionId = 'cs_test_1'): Illuminate\Testing\TestResponse
{
    fakePayMongoCheckout($sessionId);

    return test()->postJson('/api/v1/rider/wallet/topups', [
        'amount' => $amount,
        'return_url' => 'https://app.example/rider/wallet/topup-return',
    ]);
}

function balanceOf(User $rider): int
{
    return test()->getJson('/api/v1/rider/wallet')->assertOk()->json('data.balance.centavos');
}

it('opens a GCash/Maya checkout and credits nothing yet', function (): void {
    startTopup('500')
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.amount.centavos', 50000)
        ->assertJsonPath('data.checkout_url', 'https://checkout.paymongo.com/cs_test_1');

    Http::assertSent(fn (Request $request) => $request['data']['attributes']['line_items'][0]['amount'] === 50000
        && $request['data']['attributes']['payment_method_types'] === ['gcash', 'paymaya']
        && str_contains($request['data']['attributes']['success_url'], 'topup_request_id='));

    expect(balanceOf($this->rider))->toBe(0);
});

it('enforces the ₱100 to ₱5,000 top-up limits', function (): void {
    startTopup('99.99')->assertUnprocessable()->assertJsonPath('errors.amount.0', 'Top up between ₱100.00 and ₱5,000.00.');
    startTopup('5000.01')->assertUnprocessable();
    startTopup('5000')->assertCreated();
    startTopup('100')->assertCreated();
});

it('credits the wallet when the signed webhook confirms payment', function (): void {
    $id = startTopup('500')->json('data.id');

    postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_abc', 50000))->assertOk();

    expect(balanceOf($this->rider))->toBe(50000);

    $this->getJson("/api/v1/rider/wallet/topups/{$id}")
        ->assertOk()
        ->assertJsonPath('data.status', 'paid')
        ->assertJsonPath('data.reference', 'pay_abc')
        ->assertJsonPath('data.checkout_url', null);
});

it('credits a payment once no matter how often the webhook repeats', function (): void {
    startTopup('500');

    foreach (range(1, 3) as $attempt) {
        postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_abc', 50000))->assertOk();
    }

    // A second payment reference for an already-paid request is ignored too.
    postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_other', 50000))->assertOk();

    expect(balanceOf($this->rider))->toBe(50000)
        ->and(Wallet::forRider($this->rider)->transactions()->where('type', WalletTransactionType::Topup)->count())->toBe(1);
});

it('rejects a webhook with a bad or missing signature and credits nothing', function (): void {
    startTopup('500');

    postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_abc', 50000), signature: 'forged')
        ->assertUnauthorized();

    $this->call('POST', '/api/v1/webhooks/paymongo', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'], '{}')
        ->assertUnauthorized();

    expect(balanceOf($this->rider))->toBe(0);
});

it('does not credit a payment whose amount differs from the request', function (): void {
    startTopup('500');

    postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_abc', 5000))->assertOk();

    expect(balanceOf($this->rider))->toBe(0)
        ->and(TopupRequest::query()->sole()->status)->toBe(TopupStatus::Pending);
});

it('marks a failed payment, and still credits a later successful retry in the same checkout', function (): void {
    $id = startTopup('500')->json('data.id');

    postPayMongoWebhook(failedPaymentEvent('pi_for_cs_test_1', 'Insufficient balance'))->assertOk();

    $this->getJson("/api/v1/rider/wallet/topups/{$id}")
        ->assertJsonPath('data.status', 'failed')
        ->assertJsonPath('data.failure_reason', 'Insufficient balance');

    postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_retry', 50000))->assertOk();

    expect(balanceOf($this->rider))->toBe(50000);
});

it('expires unpaid top-ups after an hour, yet credits a payment that lands late', function (): void {
    $id = startTopup('500')->json('data.id');

    Date::setTestNow(Date::now()->addMinutes(61));
    $this->artisan('wallet:expire-topups')->assertSuccessful();

    $this->getJson("/api/v1/rider/wallet/topups/{$id}")->assertJsonPath('data.status', 'expired');

    postPayMongoWebhook(paidCheckoutEvent('cs_test_1', 'pay_late', 50000))->assertOk();

    expect(balanceOf($this->rider))->toBe(50000);
    Date::setTestNow();
});

it('leaves fresh top-ups pending when expiring', function (): void {
    $id = startTopup('500')->json('data.id');

    Date::setTestNow(Date::now()->addMinutes(59));
    $this->artisan('wallet:expire-topups')->assertSuccessful();

    $this->getJson("/api/v1/rider/wallet/topups/{$id}")->assertJsonPath('data.status', 'pending');
    Date::setTestNow();
});

it('fails the request cleanly when PayMongo is down', function (): void {
    Http::fake(['*/checkout_sessions' => Http::response(['errors' => [['detail' => 'down']]], 500)]);

    $this->postJson('/api/v1/rider/wallet/topups', ['amount' => '500', 'return_url' => 'https://app.example/x'])
        ->assertStatus(503)
        ->assertJsonPath('message', 'Top-ups are unavailable right now. Please try again in a few minutes.');

    expect(TopupRequest::query()->sole()->status)->toBe(TopupStatus::Failed);
});

it('acknowledges events it does not use', function (): void {
    postPayMongoWebhook(['type' => 'source.chargeable', 'data' => ['id' => 'src_1']])->assertOk();
});

it('shows a top-up only to its owner', function (): void {
    $id = startTopup('500')->json('data.id');

    Sanctum::actingAs(User::factory()->rider()->create());

    $this->getJson("/api/v1/rider/wallet/topups/{$id}")->assertNotFound();
});
