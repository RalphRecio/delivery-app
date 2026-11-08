<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Data\AuthSessionData;
use App\Domain\Auth\Data\RegisterAccountData;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Exceptions\EmailAlreadyRegisteredException;
use App\Domain\Auth\Exceptions\PhoneAlreadyRegisteredException;
use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Wallet\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Self-service sign-up for customers and riders; admins are never created
 * this way. A rider starts offline with a profile ready. The new account is
 * signed in straight away.
 */
final readonly class RegisterAccountAction
{
    private const array SELF_SERVICE_ROLES = [UserRole::Customer, UserRole::Rider];

    public function handle(RegisterAccountData $data): AuthSessionData
    {
        if (! in_array($data->role, self::SELF_SERVICE_ROLES, true)) {
            throw new InvalidArgumentException("Role {$data->role->value} cannot self-register.");
        }

        return DB::transaction(function () use ($data): AuthSessionData {
            if (User::query()->where('email', $data->email)->exists()) {
                throw new EmailAlreadyRegisteredException;
            }

            if (User::query()->where('phone', $data->phone->value)->exists()) {
                throw new PhoneAlreadyRegisteredException;
            }

            $user = User::query()->create([
                'first_name' => $data->firstName,
                'last_name' => $data->lastName,
                'email' => $data->email,
                'password' => $data->password,
                'phone' => $data->phone->value,
                'role' => $data->role,
            ]);

            if ($data->role === UserRole::Rider) {
                RiderProfile::forRider($user);
                Wallet::forRider($user);
            }

            // Reload so column defaults (deactivated_at, timestamps) are present on the model.
            $user->refresh();

            $token = $user->createToken($data->deviceName)->plainTextToken;

            Log::info('Account registered', ['user_id' => $user->id, 'role' => $data->role->value]);

            return new AuthSessionData($user, $token);
        });
    }
}
