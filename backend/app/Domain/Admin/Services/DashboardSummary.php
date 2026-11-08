<?php

declare(strict_types=1);

namespace App\Domain\Admin\Services;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Support\Facades\Date;

/**
 * The numbers on the admin home screen. Plain counts, no caching: the
 * tables are small and the screen is opened by a handful of people.
 */
final readonly class DashboardSummary
{
    /**
     * @return array{
     *   bookings_today: array<string, int>,
     *   bookings_in_progress: int,
     *   bookings_searching: int,
     *   riders_online: int,
     *   riders_total: int,
     *   customers_total: int,
     *   revenue_today: \App\Domain\Shared\ValueObjects\Money
     * }
     */
    public function build(): array
    {
        $startOfDay = Date::now()->startOfDay();

        $today = Booking::query()
            ->where('created_at', '>=', $startOfDay)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byStatus = [];

        foreach (BookingStatus::cases() as $status) {
            $byStatus[$status->value] = (int) ($today[$status->value] ?? 0);
        }

        $revenueToday = (int) Booking::query()
            ->where('status', BookingStatus::Completed)
            ->where('updated_at', '>=', $startOfDay)
            ->sum('total_fare_centavos');

        return [
            'bookings_today' => $byStatus,
            'bookings_in_progress' => Booking::query()
                ->whereIn('status', [BookingStatus::Accepted, BookingStatus::PickingUp, BookingStatus::InTransit])
                ->count(),
            'bookings_searching' => Booking::query()->where('status', BookingStatus::Searching)->count(),
            'riders_online' => RiderProfile::query()->where('is_online', true)->count(),
            'riders_total' => User::query()->where('role', UserRole::Rider)->count(),
            'customers_total' => User::query()->where('role', UserRole::Customer)->count(),
            'revenue_today' => \App\Domain\Shared\ValueObjects\Money::fromCentavos($revenueToday),
        ];
    }
}
