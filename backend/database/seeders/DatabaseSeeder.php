<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Models\Wallet;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Database\Seeder;

/**
 * Local accounts, one per role. Sign in with the email and the password
 * "password". Anyone else registers as a customer from the app.
 */
final class DatabaseSeeder extends Seeder
{
    private const string PASSWORD = 'password';

    public function run(): void
    {
        $this->call(FareSettingSeeder::class);
        $this->call(StoreSeeder::class);

        $accounts = [
            ['first_name' => 'Ada', 'last_name' => 'Admin', 'email' => 'admin@example.com', 'phone' => '+639170000001', 'role' => UserRole::Admin],
            ['first_name' => 'Rico', 'last_name' => 'Rider', 'email' => 'rider@example.com', 'phone' => '+639170000002', 'role' => UserRole::Rider],
            ['first_name' => 'Rita', 'last_name' => 'Rider', 'email' => 'rider2@example.com', 'phone' => '+639170000004', 'role' => UserRole::Rider],
            ['first_name' => 'Cathy', 'last_name' => 'Customer', 'email' => 'customer@example.com', 'phone' => '+639170000003', 'role' => UserRole::Customer],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->updateOrCreate(
                ['phone' => $account['phone']],
                [...$account, 'password' => self::PASSWORD],
            );

            if ($user->role === UserRole::Rider) {
                RiderProfile::forRider($user);
                $this->giveStartingBalance($user);
            }
        }
    }

    /**
     * Local riders start with ₱500 (an adjustment, like any manual credit)
     * so they can accept jobs without a sandbox top-up. Only once per wallet.
     */
    private function giveStartingBalance(User $rider): void
    {
        $wallet = Wallet::forRider($rider);

        if ($wallet->transactions()->exists()) {
            return;
        }

        app(WalletService::class)->adjust($rider, Money::fromPesos('500'), 'Starting balance for local testing', null);
    }
}
