<?php

declare(strict_types=1);

namespace App\Domain\Notification\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Notification\Data\PushSubscriptionData;
use Illuminate\Support\Facades\Log;

/**
 * Remembers a browser's push subscription for the signed-in user. The
 * endpoint identifies the device, so subscribing twice updates the keys
 * instead of adding a duplicate.
 */
final readonly class SubscribeToPushAction
{
    public function handle(User $user, PushSubscriptionData $data): void
    {
        $user->updatePushSubscription(
            $data->endpoint,
            $data->publicKey,
            $data->authToken,
            $data->contentEncoding,
        );

        Log::info('Push subscription saved', ['user_id' => $user->id]);
    }
}
