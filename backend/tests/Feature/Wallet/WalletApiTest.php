<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Wallet\Models\Wallet;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Support\Facades\Date;
use Laravel\Sanctum\Sanctum;

it('summarises the wallet: balance, minimum, and whether the rider can take jobs', function (): void {
    $rider = User::factory()->rider()->create();
    fundWallet($rider, '120');
    Sanctum::actingAs($rider);

    $this->getJson('/api/v1/rider/wallet')
        ->assertOk()
        ->assertJsonPath('data.balance.formatted', '₱120.00')
        ->assertJsonPath('data.minimum_balance.centavos', 15000)
        ->assertJsonPath('data.can_accept_bookings', false)
        ->assertJsonPath('data.shortfall.centavos', 3000)
        ->assertJsonPath('data.topup_limits.min.centavos', 10000)
        ->assertJsonPath('data.topup_limits.max.centavos', 500000);
});

it('lists transactions newest first, filtered by type and date, with what they relate to', function (): void {
    $rider = User::factory()->rider()->create();
    $wallets = app(WalletService::class);

    Date::setTestNow('2026-11-01 09:00:00');
    fundWallet($rider, '500');
    Date::setTestNow('2026-11-03 10:00:00');
    $booking = Booking::factory()->status(BookingStatus::Completed)->create(['rider_id' => $rider->id, 'total_fare_centavos' => 7900, 'commission_rate_bps' => 1000]);
    $wallets->chargeCommission($booking);
    Date::setTestNow();

    Sanctum::actingAs($rider);

    $this->getJson('/api/v1/rider/wallet/transactions')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.type', 'commission')
        ->assertJsonPath('data.0.amount.centavos', -790)
        ->assertJsonPath('data.0.booking.reference', $booking->reference)
        ->assertJsonPath('data.1.type', 'adjustment')
        ->assertJsonPath('meta.total', 2);

    $this->getJson('/api/v1/rider/wallet/transactions?type=adjustment')->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/rider/wallet/transactions?from=2026-11-02&to=2026-11-03')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'commission');
    $this->getJson('/api/v1/rider/wallet/transactions?type=bonus')->assertUnprocessable();
});

it('is for riders only', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/v1/rider/wallet')->assertForbidden();
});

it('gives every new rider a wallet, self-registered or created by an admin', function (): void {
    $this->postJson('/api/v1/auth/register', [
        'account_type' => 'rider', 'first_name' => 'Rico', 'last_name' => 'Rider',
        'email' => 'rico@example.com', 'password' => 'correct horse', 'phone' => '09175550002',
    ])->assertCreated();

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->postJson('/api/v1/admin/riders', [
        'first_name' => 'Rita', 'last_name' => 'Rider', 'email' => 'rita@example.com',
        'phone' => '09175550003', 'password' => 'first-password',
    ])->assertCreated();

    expect(Wallet::query()->count())->toBe(2);
});

it('records a manual adjustment from the command line, and requires a reason', function (): void {
    $rider = User::factory()->rider()->create(['email' => 'rico@example.com']);

    $this->artisan('wallet:adjust', ['email' => 'rico@example.com', 'amount' => '-50.25', '--reason' => 'Correction for BK-1'])
        ->expectsOutputToContain('Recorded -₱50.25')
        ->assertSuccessful();

    $this->artisan('wallet:adjust', ['email' => 'rico@example.com', 'amount' => '10'])
        ->expectsOutputToContain('An adjustment needs a reason.')
        ->assertFailed();

    $wallets = app(WalletService::class);
    expect($wallets->balance($wallets->walletFor($rider))->centavos)->toBe(-5025);
});
