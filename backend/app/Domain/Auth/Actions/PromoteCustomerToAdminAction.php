<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Exceptions\CannotPromoteToAdminException;
use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Makes an existing customer an admin, e.g. a staff member who already
 * signed up to order. They keep their email, number and password, and sign
 * in again on the admin page. Only an admin can do this, one account at a
 * time, and it is logged as a warning so it stands out.
 */
final readonly class PromoteCustomerToAdminAction
{
    public function handle(User $admin, User $customer): User
    {
        return DB::transaction(function () use ($admin, $customer): User {
            // Lock the row so two admins clicking at once cannot race a role change.
            $customer = User::query()->whereKey($customer->id)->lockForUpdate()->firstOrFail();

            if ($customer->role !== UserRole::Customer) {
                throw CannotPromoteToAdminException::notACustomer();
            }

            if ($this->hasActiveBooking($customer)) {
                throw CannotPromoteToAdminException::hasActiveBooking();
            }

            $customer->role = UserRole::Admin;
            $customer->save();

            // Their customer-app sessions end; they sign in again on the admin page.
            $customer->tokens()->delete();

            Log::warning('Customer promoted to admin', ['user_id' => $admin->id, 'new_admin_id' => $customer->id]);

            return $customer;
        });
    }

    private function hasActiveBooking(User $customer): bool
    {
        $finished = array_map(
            static fn (BookingStatus $status) => $status->value,
            array_filter(BookingStatus::cases(), static fn (BookingStatus $status) => $status->isTerminal()),
        );

        return Booking::query()
            ->where('customer_id', $customer->id)
            ->whereNotIn('status', array_values($finished))
            ->exists();
    }
}
