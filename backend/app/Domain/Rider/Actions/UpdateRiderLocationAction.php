<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Support\Facades\Date;

/**
 * Stores the rider's latest position. The app throttles how often it
 * reports; the server simply keeps the newest fix.
 */
final readonly class UpdateRiderLocationAction
{
    public function handle(User $rider, GeoPoint $location): RiderProfile
    {
        $profile = RiderProfile::forRider($rider);
        $profile->current_location = $location;
        $profile->location_updated_at = Date::now();
        $profile->save();

        return $profile->refresh();
    }
}
