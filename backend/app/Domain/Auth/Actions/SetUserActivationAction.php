<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Deactivating signs the user out everywhere (tokens revoked), takes a rider
 * offline, and blocks future sign-ins. Reactivating simply lifts the block.
 */
final readonly class SetUserActivationAction
{
    public function handle(User $admin, User $user, bool $isActive): User
    {
        return DB::transaction(function () use ($admin, $user, $isActive): User {
            $user->deactivated_at = $isActive ? null : Date::now();
            $user->save();

            if (! $isActive) {
                $user->tokens()->delete();
                RiderProfile::query()->where('user_id', $user->id)->update(['is_online' => false]);
            }

            Log::info($isActive ? 'User reactivated' : 'User deactivated', ['user_id' => $admin->id, 'target_user_id' => $user->id]);

            return $user;
        });
    }
}
