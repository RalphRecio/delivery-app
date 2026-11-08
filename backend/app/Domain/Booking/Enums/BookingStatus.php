<?php

declare(strict_types=1);

namespace App\Domain\Booking\Enums;

/**
 * The booking life cycle. The allowed moves are written down here and
 * nowhere else; TransitionBookingStatusAction is the only code that
 * changes a booking's status and it always asks canTransitionTo() first.
 *
 * pending ─► searching ─► accepted ─► picking_up ─► in_transit ─► completed
 *    └──────────┴────────────┴─────────────┴──────────────┴──► cancelled
 */
enum BookingStatus: string
{
    case Pending = 'pending';
    case Searching = 'searching';
    case Accepted = 'accepted';
    case PickingUp = 'picking_up';
    case InTransit = 'in_transit';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $status) => $status->value, self::cases());
    }

    /** @return list<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Searching, self::Cancelled],
            self::Searching => [self::Accepted, self::Cancelled],
            self::Accepted => [self::PickingUp, self::Cancelled],
            self::PickingUp => [self::InTransit, self::Cancelled],
            self::InTransit => [self::Completed, self::Cancelled],
            self::Completed, self::Cancelled => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }

    /**
     * Extra moves only support may make, on top of the normal ones: cancelling
     * a completed booking (disputes, fake deliveries). For everyone else a
     * completed booking stays final, which is why isTerminal() is unchanged.
     */
    public function canSupportTransitionTo(self $next): bool
    {
        return $this->canTransitionTo($next) || ($this === self::Completed && $next === self::Cancelled);
    }

    public function isTerminal(): bool
    {
        return $this->allowedTransitions() === [];
    }

    /**
     * A rider is assigned and working the job, so the customer may see where
     * they are. Before acceptance there is no rider; after delivery or
     * cancellation the rider's position is theirs again.
     */
    public function isRiderTrackable(): bool
    {
        return in_array($this, [self::Accepted, self::PickingUp, self::InTransit], true);
    }

    /**
     * A customer may back out until a rider is on the way. From picking_up
     * on, the rider has already invested time and fuel, so cancellation
     * becomes a support action (with a fee, in a later phase).
     */
    public function isCancellableByCustomer(): bool
    {
        return in_array($this, [self::Pending, self::Searching, self::Accepted], true);
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Searching => 'Finding a rider',
            self::Accepted => 'Rider assigned',
            self::PickingUp => 'Rider heading to pickup',
            self::InTransit => 'On the way',
            self::Completed => 'Delivered',
            self::Cancelled => 'Cancelled',
        };
    }
}
