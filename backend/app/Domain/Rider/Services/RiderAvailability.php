<?php

declare(strict_types=1);

namespace App\Domain\Rider\Services;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Rider\Data\MatchingSettings;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Date;

/**
 * What customers may know about the rider pool: how many riders are on
 * duty. Never who they are or where; that is shared only with the
 * customer whose booking a rider accepted.
 *
 * On duty means: switched online, account active, and the rider app has
 * sent a heartbeat recently. The switch alone stays on after a rider
 * closes the app, so it is not enough.
 */
final readonly class RiderAvailability
{
    public function __construct(
        private MatchingSettings $settings,
    ) {}

    public function onDutyCount(): int
    {
        return RiderProfile::query()
            ->where('is_online', true)
            ->where('last_seen_at', '>=', Date::now()->subSeconds($this->settings->presenceTimeoutSeconds))
            ->whereHas('user', fn (Builder $query) => $query
                ->where('role', UserRole::Rider)
                ->whereNull('deactivated_at'))
            ->count();
    }
}
