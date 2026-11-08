<?php

declare(strict_types=1);

namespace App\Domain\Rider\Models;

use App\Domain\Auth\Models\User;
use App\Domain\Shared\Casts\GeoPointCast;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Date;

/**
 * What the matcher needs to know about a rider: whether they want jobs
 * right now and where they last were. One row per rider user, created on
 * first use.
 *
 * @property int $id
 * @property int $user_id
 * @property bool $is_online
 * @property GeoPoint|null $current_location
 * @property CarbonImmutable|null $location_updated_at
 * @property CarbonImmutable|null $last_seen_at Last heartbeat from the rider app
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read User $user
 */
#[Fillable(['user_id', 'is_online', 'current_location', 'location_updated_at', 'last_seen_at'])]
final class RiderProfile extends Model
{
    public static function forRider(User $rider): self
    {
        return self::query()->firstOrCreate(['user_id' => $rider->id], ['is_online' => false]);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasFreshLocation(int $staleAfterSeconds): bool
    {
        return $this->current_location !== null
            && $this->location_updated_at !== null
            && $this->location_updated_at->diffInSeconds(Date::now()) <= $staleAfterSeconds;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_online' => 'boolean',
            'current_location' => GeoPointCast::class,
            'location_updated_at' => 'immutable_datetime',
            'last_seen_at' => 'immutable_datetime',
        ];
    }
}
