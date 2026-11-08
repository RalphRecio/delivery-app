<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Rider\Actions\SetRiderAvailabilityAction;
use Illuminate\Support\Facades\Log;

/**
 * Signs out the device that made the request; other devices stay signed in.
 * Only reachable behind auth:sanctum with a bearer token, so the current
 * token is always a stored PersonalAccessToken. A rider who signs out also
 * goes offline, so customers never count a rider who has left the app.
 */
final readonly class RevokeCurrentTokenAction
{
    public function __construct(
        private SetRiderAvailabilityAction $setAvailability,
    ) {}

    public function handle(User $user): void
    {
        $user->currentAccessToken()->delete();

        if ($user->hasRole(UserRole::Rider)) {
            $this->setAvailability->handle($user, false);
        }

        Log::info('User signed out', ['user_id' => $user->id]);
    }
}
