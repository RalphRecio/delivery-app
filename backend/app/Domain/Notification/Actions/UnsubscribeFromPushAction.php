<?php

declare(strict_types=1);

namespace App\Domain\Notification\Actions;

use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\Log;

/** Forgets one browser's subscription, e.g. the user turned notifications off. */
final readonly class UnsubscribeFromPushAction
{
    public function handle(User $user, string $endpoint): void
    {
        $user->deletePushSubscription($endpoint);

        Log::info('Push subscription removed', ['user_id' => $user->id]);
    }
}
