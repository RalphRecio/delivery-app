<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Data\AuthSessionData;
use App\Domain\Auth\Data\LoginData;
use App\Domain\Auth\Exceptions\AccountDeactivatedException;
use App\Domain\Auth\Exceptions\InvalidCredentialsException;
use App\Domain\Auth\Exceptions\WrongSignInPageException;
use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * Exchanges an email and password for a bearer token, one token per device.
 * Customers, riders and admins each sign in on their own page; a matching
 * password on the wrong page gets no token, just directions.
 */
final readonly class LoginAction
{
    public function handle(LoginData $data): AuthSessionData
    {
        $user = User::query()->where('email', $data->email)->first();

        if ($user === null || ! Hash::check($data->password, $user->password)) {
            Log::notice('Login failed', ['email' => $data->email]);

            throw new InvalidCredentialsException;
        }

        if (! $user->isActive()) {
            throw new AccountDeactivatedException;
        }

        if ($data->portal !== null && $user->role !== $data->portal) {
            throw new WrongSignInPageException($user->role);
        }

        $token = $user->createToken($data->deviceName)->plainTextToken;

        Log::info('User signed in', ['user_id' => $user->id, 'role' => $user->role->value]);

        return new AuthSessionData($user, $token);
    }
}
