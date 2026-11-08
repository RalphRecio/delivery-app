<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Data\CreateRiderData;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Exceptions\EmailAlreadyRegisteredException;
use App\Domain\Auth\Exceptions\PhoneAlreadyRegisteredException;
use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Wallet\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Riders are provisioned by an admin, never by signing up, so nobody can
 * grant themselves the rider role. The admin sets the first password and
 * hands it over; the rider then signs in with email and password.
 */
final readonly class CreateRiderAccountAction
{
    public function handle(User $admin, CreateRiderData $data): User
    {
        return DB::transaction(function () use ($admin, $data): User {
            if (User::query()->where('email', $data->email)->exists()) {
                throw new EmailAlreadyRegisteredException;
            }

            if (User::query()->where('phone', $data->phone->value)->exists()) {
                throw new PhoneAlreadyRegisteredException;
            }

            $rider = User::query()->create([
                'first_name' => $data->firstName,
                'last_name' => $data->lastName,
                'email' => $data->email,
                'password' => $data->password,
                'phone' => $data->phone->value,
                'role' => UserRole::Rider,
            ]);

            RiderProfile::forRider($rider);
            Wallet::forRider($rider);

            Log::info('Rider account created', ['user_id' => $admin->id, 'rider_id' => $rider->id]);

            // Reload so column defaults (deactivated_at, timestamps) are present on the model.
            return $rider->refresh();
        });
    }
}
