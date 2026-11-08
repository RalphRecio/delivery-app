<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Wallet\Enums\WalletTransactionType;
use App\Domain\Wallet\Models\Wallet;
use App\Domain\Wallet\Models\WalletTransaction;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

function fundedRider(string $pesos = '500'): User
{
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill(['is_online' => true])->save();
    fundWallet($rider, $pesos);

    return $rider;
}

function walletBalance(User $rider): int
{
    $wallets = app(WalletService::class);

    return $wallets->balance($wallets->walletFor($rider))->centavos;
}

function complete(User $rider, Booking $booking): void
{
    Sanctum::actingAs($rider);
    test()->postJson("/api/v1/rider/jobs/{$booking->id}/status", ['status' => 'completed'])->assertOk();
}

it('deducts the commission from the rider when a cash booking completes', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create([
        'rider_id' => $rider->id, 'total_fare_centavos' => 7900, 'commission_rate_bps' => 1000,
    ]);

    complete($rider, $booking);

    $commission = WalletTransaction::query()->where('booking_id', $booking->id)->sole();

    expect($commission->type)->toBe(WalletTransactionType::Commission)
        ->and($commission->amount_centavos)->toBe(-790)
        ->and(walletBalance($rider))->toBe(50000 - 790);
});

it('charges Pabili commission on the fare only, never on the items the rider paid for', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->pabili()->status(BookingStatus::InTransit)->create([
        'rider_id' => $rider->id,
        'total_fare_centavos' => 7900,          // ₱59 base + ₱20 service fee
        'purchase_budget_centavos' => 300000,   // ₱3,000 of groceries, repaid by the customer
        'items_subtotal_centavos' => 250000,
        'commission_rate_bps' => 1000,
    ]);

    complete($rider, $booking);

    expect(WalletTransaction::query()->where('booking_id', $booking->id)->sole()->amount_centavos)->toBe(-790);
});

it('uses the rate saved on the booking, not the current tariff', function (): void {
    $this->seed(Database\Seeders\FareSettingSeeder::class);
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create([
        'rider_id' => $rider->id, 'total_fare_centavos' => 10000, 'commission_rate_bps' => 1000,
    ]);

    App\Domain\Booking\Models\FareSetting::query()->update(['commission_rate_bps' => 2500]);

    complete($rider, $booking);

    expect(WalletTransaction::query()->where('booking_id', $booking->id)->sole()->amount_centavos)->toBe(-1000);
});

it('saves the tariff rate on each new booking', function (): void {
    $this->seed(Database\Seeders\FareSettingSeeder::class);
    App\Domain\Booking\Models\FareSetting::query()->where('service_type', 'pasuyo')->update(['commission_rate_bps' => 1500]);
    Sanctum::actingAs(User::factory()->create());

    $id = $this->postJson('/api/v1/customer/bookings/pasuyo', [
        'pickup' => ['address' => 'A', 'latitude' => 10.3119, 'longitude' => 123.918],
        'dropoff' => ['address' => 'B', 'latitude' => 10.3181, 'longitude' => 123.905],
        'recipient_name' => 'Juan', 'recipient_phone' => '09171234567', 'parcel_description' => 'Docs',
    ])->assertCreated()->json('data.id');

    expect(Booking::query()->findOrFail($id)->commission_rate_bps)->toBe(1500);
});

it('charges no commission on bookings made before the wallet existed', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => $rider->id, 'commission_rate_bps' => null]);

    complete($rider, $booking);

    expect(WalletTransaction::query()->where('booking_id', $booking->id)->exists())->toBeFalse();
});

it('charges a booking once even if the completion hook runs again', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::Completed)->create([
        'rider_id' => $rider->id, 'total_fare_centavos' => 7900, 'commission_rate_bps' => 1000,
    ]);
    $wallets = app(WalletService::class);

    $wallets->chargeCommission($booking);
    $wallets->chargeCommission($booking);

    expect(WalletTransaction::query()->where('booking_id', $booking->id)->count())->toBe(1);
});

it('has a database guard against a second commission row for a booking', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::Completed)->create(['rider_id' => $rider->id]);
    $wallet = Wallet::forRider($rider);
    $row = ['wallet_id' => $wallet->id, 'type' => 'commission', 'amount_centavos' => -100, 'booking_id' => $booking->id];

    DB::table('wallet_transactions')->insert($row);

    expect(fn () => DB::table('wallet_transactions')->insert($row))->toThrow(QueryException::class);
});

it('keeps the balance exact across back-to-back deductions on one wallet', function (): void {
    $rider = fundedRider('500');
    $bookings = Booking::factory()->count(5)->status(BookingStatus::Completed)->create([
        'rider_id' => $rider->id, 'total_fare_centavos' => 7900, 'commission_rate_bps' => 1000,
    ]);
    $wallets = app(WalletService::class);

    // Each charge locks the wallet row; interleaving them with top-ups and
    // adjustments must still sum exactly.
    foreach ($bookings as $index => $booking) {
        $wallets->chargeCommission($booking);
        $wallets->adjust($rider, App\Domain\Shared\ValueObjects\Money::fromPesos('1'), "Interleaved {$index}", null);
    }

    expect(walletBalance($rider))->toBe(50000 - 5 * 790 + 5 * 100);
});

it('blocks accepting below the ₱150 minimum and says how to fix it', function (): void {
    $rider = fundedRider('149.99');
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    Sanctum::actingAs($rider);

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")
        ->assertStatus(409)
        ->assertJsonPath('errors.wallet_balance.0', 'Your wallet balance is ₱149.99. Top up to at least ₱150.00 to accept jobs.');

    fundWallet($rider, '0.01');

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")->assertOk();
});

it('refunds the commission when support cancels a completed booking', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create([
        'rider_id' => $rider->id, 'total_fare_centavos' => 7900, 'commission_rate_bps' => 1000,
    ]);
    complete($rider, $booking);
    $admin = User::factory()->admin()->create();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/cancel", ['reason' => 'Customer disputed the delivery'])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    $refund = WalletTransaction::query()->where('booking_id', $booking->id)->where('type', WalletTransactionType::Refund)->sole();

    expect($refund->amount_centavos)->toBe(790)
        ->and($refund->created_by)->toBe($admin->id)
        ->and($refund->reason)->toContain('Customer disputed the delivery')
        ->and(walletBalance($rider))->toBe(50000);
});

it('refunds nothing when support cancels a job that never completed', function (): void {
    $rider = fundedRider('500');
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => $rider->id, 'commission_rate_bps' => 1000]);
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->postJson("/api/v1/admin/bookings/{$booking->id}/cancel", ['reason' => 'Rider unwell'])->assertOk();

    expect(WalletTransaction::query()->where('booking_id', $booking->id)->exists())->toBeFalse();
});

it('keeps the ledger append-only, in the model and in the database', function (): void {
    $rider = fundedRider('500');
    $entry = Wallet::forRider($rider)->transactions()->sole();

    expect(fn () => $entry->update(['amount_centavos' => 999999]))->toThrow(LogicException::class)
        ->and(fn () => $entry->delete())->toThrow(LogicException::class)
        ->and(fn () => DB::table('wallet_transactions')->where('id', $entry->id)->update(['amount_centavos' => 1]))->toThrow(QueryException::class)
        ->and(fn () => DB::table('wallet_transactions')->where('id', $entry->id)->delete())->toThrow(QueryException::class);
});
