<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Services\WalletService;
use Illuminate\Console\Command;
use InvalidArgumentException;

/**
 * Manual correction until there is an admin wallet screen, e.g.
 *   php artisan wallet:adjust rider@example.com -- -50.00 --reason="Double commission on BK-123"
 */
final class AdjustWalletCommand extends Command
{
    protected $signature = 'wallet:adjust {email : The rider\'s email} {amount : Pesos, negative to deduct (e.g. 50 or -50.00)} {--reason= : Why (required)} {--by= : Email of the admin making the change}';

    protected $description = "Add a signed adjustment to a rider's wallet, with a reason";

    public function handle(WalletService $wallets): int
    {
        $rider = User::query()->where('email', mb_strtolower((string) $this->argument('email')))->first();

        if ($rider === null || ! $rider->hasRole(UserRole::Rider)) {
            $this->error('No rider with that email.');

            return self::FAILURE;
        }

        $actor = $this->option('by') === null ? null : User::query()->where('email', mb_strtolower((string) $this->option('by')))->first();

        try {
            $transaction = $wallets->adjust($rider, Money::fromPesos((string) $this->argument('amount')), (string) $this->option('reason'), $actor);
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $balance = $wallets->balance($wallets->walletFor($rider));
        $this->info("Recorded {$transaction->amount()->format()} for {$rider->email}. Balance now {$balance->format()}.");

        return self::SUCCESS;
    }
}
