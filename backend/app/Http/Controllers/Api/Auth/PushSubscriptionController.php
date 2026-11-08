<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\Models\User;
use App\Domain\Notification\Actions\SubscribeToPushAction;
use App\Domain\Notification\Actions\UnsubscribeFromPushAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\DeletePushSubscriptionRequest;
use App\Http\Requests\Auth\StorePushSubscriptionRequest;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

/** Web push for the signed-in user's browsers, whatever their role. */
final class PushSubscriptionController extends Controller
{
    /** The VAPID public key a browser needs to subscribe; empty when push is not configured. */
    public function publicKey(): JsonResponse
    {
        return ApiResponse::success(['public_key' => Config::string('webpush.vapid.public_key', '')]);
    }

    public function store(StorePushSubscriptionRequest $request, SubscribeToPushAction $subscribe): JsonResponse
    {
        $subscribe->handle($this->user($request), $request->toData());

        return ApiResponse::success(null, 'Notifications are on for this device.');
    }

    public function destroy(DeletePushSubscriptionRequest $request, UnsubscribeFromPushAction $unsubscribe): JsonResponse
    {
        $unsubscribe->handle($this->user($request), $request->endpoint());

        return ApiResponse::success(null, 'Notifications are off for this device.');
    }

    private function user(Request $request): User
    {
        /** @var User $user auth:sanctum guarantees a user here */
        $user = $request->user();

        return $user;
    }
}
