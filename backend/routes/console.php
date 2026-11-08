<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

/*
 * Scheduled work. Run `php artisan schedule:work` locally (or the system
 * cron entry in production) for these to fire.
 */
Schedule::command('bookings:widen-search')->everyMinute()->withoutOverlapping();
Schedule::command('wallet:expire-topups')->everyMinute()->withoutOverlapping();
