<?php

declare(strict_types=1);

use App\Domain\Booking\Enums\BookingStatus;

/**
 * The full transition matrix, written out so a change to the state machine
 * has to be made here on purpose.
 */
it('allows exactly the documented transitions', function (BookingStatus $from, array $allowed): void {
    foreach (BookingStatus::cases() as $to) {
        expect($from->canTransitionTo($to))->toBe(
            in_array($to, $allowed, true),
            "{$from->value} -> {$to->value}",
        );
    }
})->with([
    'pending' => [BookingStatus::Pending, [BookingStatus::Searching, BookingStatus::Cancelled]],
    'searching' => [BookingStatus::Searching, [BookingStatus::Accepted, BookingStatus::Cancelled]],
    'accepted' => [BookingStatus::Accepted, [BookingStatus::PickingUp, BookingStatus::Cancelled]],
    'picking_up' => [BookingStatus::PickingUp, [BookingStatus::InTransit, BookingStatus::Cancelled]],
    'in_transit' => [BookingStatus::InTransit, [BookingStatus::Completed, BookingStatus::Cancelled]],
    'completed' => [BookingStatus::Completed, []],
    'cancelled' => [BookingStatus::Cancelled, []],
]);

it('treats completed and cancelled as terminal', function (): void {
    foreach (BookingStatus::cases() as $status) {
        expect($status->isTerminal())->toBe(
            in_array($status, [BookingStatus::Completed, BookingStatus::Cancelled], true),
        );
    }
});

it('lets a customer cancel only before the rider is on the way', function (): void {
    foreach (BookingStatus::cases() as $status) {
        expect($status->isCancellableByCustomer())->toBe(
            in_array($status, [BookingStatus::Pending, BookingStatus::Searching, BookingStatus::Accepted], true),
            $status->value,
        );
    }
});
