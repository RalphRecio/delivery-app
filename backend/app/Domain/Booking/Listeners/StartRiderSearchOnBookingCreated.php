<?php

declare(strict_types=1);

namespace App\Domain\Booking\Listeners;

use App\Domain\Booking\Events\BookingCreated;
use App\Domain\Rider\Actions\StartRiderSearchAction;

/**
 * Runs synchronously right after the creating transaction commits, so the
 * customer's create response already shows the booking as `searching`.
 */
final readonly class StartRiderSearchOnBookingCreated
{
    public function __construct(
        private StartRiderSearchAction $startSearch,
    ) {}

    public function handle(BookingCreated $event): void
    {
        $this->startSearch->handle($event->booking);
    }
}
