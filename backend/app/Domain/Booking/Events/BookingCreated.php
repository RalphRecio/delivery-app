<?php

declare(strict_types=1);

namespace App\Domain\Booking\Events;

use App\Domain\Booking\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;

/** Fired after commit. The matching phase listens to start the rider search. */
final class BookingCreated
{
    use Dispatchable;

    public function __construct(public readonly Booking $booking) {}
}
