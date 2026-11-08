<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Models;

use App\Domain\Auth\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A rider's wallet. Deliberately has no balance column: the balance is the
 * sum of its transactions (WalletService::balance()).
 *
 * @property int $id
 * @property int $user_id
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read User $user
 */
#[Fillable(['user_id'])]
final class Wallet extends Model
{
    public static function forRider(User $rider): self
    {
        return self::query()->firstOrCreate(['user_id' => $rider->id]);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<WalletTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /** @return HasMany<TopupRequest, $this> */
    public function topupRequests(): HasMany
    {
        return $this->hasMany(TopupRequest::class);
    }
}
