<?php

declare(strict_types=1);

namespace App\Domain\Booking\Models;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only history of every status change, with who did it and why.
 *
 * @property int $id
 * @property int $booking_id
 * @property BookingStatus|null $from_status Null for the initial status
 * @property BookingStatus $to_status
 * @property int|null $actor_id Null when the system acted (timeouts, jobs)
 * @property string|null $reason
 * @property CarbonImmutable $created_at
 * @property-read User|null $actor
 */
#[Fillable(['booking_id', 'from_status', 'to_status', 'actor_id', 'reason'])]
final class BookingStatusLog extends Model
{
    public const UPDATED_AT = null;

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'from_status' => BookingStatus::class,
            'to_status' => BookingStatus::class,
            'created_at' => 'immutable_datetime',
        ];
    }
}
