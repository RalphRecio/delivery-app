<?php

declare(strict_types=1);

namespace App\Domain\Auth\Models;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Rider\Models\RiderProfile;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

/**
 * Every person who signs in: customers, riders and admins share one table
 * and are told apart by `role`. Identity is an email and a password;
 * sessions are Sanctum bearer tokens. Push subscriptions (one per browser
 * that turned notifications on) hang off the user for web push.
 *
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property-read string $name "First Last", for display
 * @property string $email Lower-cased before it gets here
 * @property string $password Hashed by the cast
 * @property string $phone E.164, see PhoneNumber
 * @property UserRole $role
 * @property CarbonImmutable|null $deactivated_at
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 */
#[Fillable(['first_name', 'last_name', 'email', 'password', 'phone', 'role', 'deactivated_at'])]
#[Hidden(['password', 'remember_token'])]
#[UseFactory(UserFactory::class)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasPushSubscriptions, Notifiable;

    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    public function isActive(): bool
    {
        return $this->deactivated_at === null;
    }

    /** @return HasOne<RiderProfile, $this> */
    public function riderProfile(): HasOne
    {
        return $this->hasOne(RiderProfile::class);
    }

    /**
     * Matches the full name, the email or the phone.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        $like = '%'.$term.'%';

        return $query->where(fn (Builder $q) => $q
            ->whereRaw("first_name || ' ' || last_name ILIKE ?", [$like])
            ->orWhere('email', 'ilike', $like)
            ->orWhere('phone', 'like', $like));
    }

    /** @return Attribute<string, never> */
    protected function name(): Attribute
    {
        return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'deactivated_at' => 'immutable_datetime',
            'role' => UserRole::class,
        ];
    }
}
