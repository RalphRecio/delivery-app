<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Actions\TransitionBookingStatusAction;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Exceptions\InvalidStatusTransitionException;
use App\Domain\Booking\Models\Booking;

it('moves a booking along the happy path, logging each step', function (): void {
    $booking = Booking::factory()->create();
    $rider = User::factory()->rider()->create();
    $action = app(TransitionBookingStatusAction::class);

    $path = [BookingStatus::Searching, BookingStatus::Accepted, BookingStatus::PickingUp, BookingStatus::InTransit, BookingStatus::Completed];

    foreach ($path as $next) {
        $booking = $action->handle($booking, $next, $rider);
        expect($booking->status)->toBe($next);
    }

    $logs = $booking->statusLogs()->get();

    expect($logs)->toHaveCount(5)
        ->and($logs->first()?->from_status)->toBe(BookingStatus::Pending)
        ->and($logs->last()?->to_status)->toBe(BookingStatus::Completed)
        ->and($logs->last()?->actor_id)->toBe($rider->id);
});

it('rejects an invalid transition and changes nothing', function (): void {
    $booking = Booking::factory()->create();

    expect(fn () => app(TransitionBookingStatusAction::class)->handle($booking, BookingStatus::Completed, null))
        ->toThrow(InvalidStatusTransitionException::class, 'cannot move from pending to completed');

    expect($booking->refresh()->status)->toBe(BookingStatus::Pending)
        ->and($booking->statusLogs()->count())->toBe(0);
});

it('checks the transition against the current database status, not a stale model', function (): void {
    $booking = Booking::factory()->create();
    $stale = Booking::query()->findOrFail($booking->id);
    $action = app(TransitionBookingStatusAction::class);

    $action->handle($booking, BookingStatus::Cancelled, null, 'first');

    // $stale still says "pending", but the row is cancelled: the lock re-reads it.
    expect(fn () => $action->handle($stale, BookingStatus::Searching, null))
        ->toThrow(InvalidStatusTransitionException::class);
});
