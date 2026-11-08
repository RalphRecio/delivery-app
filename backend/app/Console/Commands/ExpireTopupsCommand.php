<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Wallet\Actions\ExpireStaleTopupsAction;
use Illuminate\Console\Command;

final class ExpireTopupsCommand extends Command
{
    protected $signature = 'wallet:expire-topups';

    protected $description = 'Mark unpaid top-ups past their window as expired';

    public function handle(ExpireStaleTopupsAction $expire): int
    {
        $count = $expire->handle();
        $this->info("Expired {$count} top-up(s).");

        return self::SUCCESS;
    }
}
