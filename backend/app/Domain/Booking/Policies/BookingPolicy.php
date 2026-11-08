<?php

declare(strict_types=1);

namespace App\Domain\Booking\Policies;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;

/**
 * Customers only ever see and act on their own bookings; riders only on the
 * jobs assigned to them. Whether a transition is allowed right now is the
 * state machine's business, not the policy's.
 */
final class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $booking->isOwnedBy($user);
    }

    public function cancel(User $user, Booking $booking): bool
    {
        return $booking->isOwnedBy($user);
    }

    /** Any rider may look at an open job; an assigned job only by its rider. */
    public function viewAsRider(User $user, Booking $booking): bool
    {
        return $user->hasRole(UserRole::Rider) && ($booking->rider_id === null || $booking->isAssignedTo($user));
    }

    public function accept(User $user, Booking $booking): bool
    {
        return $user->hasRole(UserRole::Rider);
    }

    public function progress(User $user, Booking $booking): bool
    {
        return $booking->isAssignedTo($user);
    }

    /** Support staff see and cancel any booking. */
    public function manage(User $user, Booking $booking): bool
    {
        return $user->hasRole(UserRole::Admin);
    }
}
