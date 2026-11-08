<?php

declare(strict_types=1);

namespace App\Domain\Booking\Events;

use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;

/** Fired after commit for every transition. Notifications and realtime updates hang off this. */
final class BookingStatusChanged
{
    use Dispatchable;

    public function __construct(
        public readonly Booking $booking,
        public readonly BookingStatus $from,
        public readonly BookingStatus $to,
    ) {}
}
