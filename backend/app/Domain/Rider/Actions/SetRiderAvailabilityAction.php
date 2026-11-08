<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Log;

final readonly class SetRiderAvailabilityAction
{
    public function handle(User $rider, bool $isOnline): RiderProfile
    {
        $profile = RiderProfile::forRider($rider);
        $profile->is_online = $isOnline;

        // Going online counts as being seen, so the rider shows up before the first heartbeat.
        if ($isOnline) {
            $profile->last_seen_at = Date::now();
        }
        $profile->save();

        Log::info($isOnline ? 'Rider went online' : 'Rider went offline', ['user_id' => $rider->id]);

        return $profile;
    }
}
