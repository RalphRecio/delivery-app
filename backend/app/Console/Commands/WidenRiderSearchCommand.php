<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Rider\Actions\WidenRiderSearchAction;
use Illuminate\Console\Command;

final class WidenRiderSearchCommand extends Command
{
    protected $signature = 'bookings:widen-search';

    protected $description = 'Widen the rider search radius of bookings nobody has accepted yet';

    public function handle(WidenRiderSearchAction $widenSearch): int
    {
        $count = $widenSearch->handle();

        $this->info("Widened {$count} booking(s).");

        return self::SUCCESS;
    }
}
