<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\Actions\RevokeCurrentTokenAction;
use App\Domain\Auth\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SessionController extends Controller
{
    /** The signed-in user behind the bearer token. */
    public function show(Request $request): UserResource
    {
        return UserResource::make($this->currentUser($request));
    }

    public function destroy(Request $request, RevokeCurrentTokenAction $revokeToken): JsonResponse
    {
        $revokeToken->handle($this->currentUser($request));

        return ApiResponse::success(null, 'Signed out.');
    }

    private function currentUser(Request $request): User
    {
        /** @var User $user auth:sanctum guarantees a user here */
        $user = $request->user();

        return $user;
    }
}
