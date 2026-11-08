<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Support\Facades\Date;

/** Notes that the rider app is open right now; RiderAvailability reads it. */
final readonly class RecordRiderHeartbeatAction
{
    public function handle(User $rider): RiderProfile
    {
        $profile = RiderProfile::forRider($rider);
        $profile->last_seen_at = Date::now();
        $profile->save();

        return $profile;
    }
}
