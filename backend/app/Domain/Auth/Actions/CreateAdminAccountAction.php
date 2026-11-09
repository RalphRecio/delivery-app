<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Data\CreateAdminData;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Exceptions\EmailAlreadyRegisteredException;
use App\Domain\Auth\Exceptions\PhoneAlreadyRegisteredException;
use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Only an existing admin can create another admin; nobody can sign up into
 * the role. This never changes an existing account: a customer is made an
 * admin only through PromoteCustomerToAdminAction, an explicit step, so a
 * typo in this form cannot hand someone admin rights. Logged as a warning so
 * new admins stand out in the logs.
 */
final readonly class CreateAdminAccountAction
{
    public function handle(User $admin, CreateAdminData $data): User
    {
        return DB::transaction(function () use ($admin, $data): User {
            $existing = User::query()->where('email', $data->email)->first();

            if ($existing !== null) {
                throw $existing->role === UserRole::Customer
                    ? EmailAlreadyRegisteredException::belongsToCustomer()
                    : new EmailAlreadyRegisteredException;
            }

            if (User::query()->where('phone', $data->phone->value)->exists()) {
                throw new PhoneAlreadyRegisteredException;
            }

            $newAdmin = User::query()->create([
                'first_name' => $data->firstName,
                'last_name' => $data->lastName,
                'email' => $data->email,
                'password' => $data->password,
                'phone' => $data->phone->value,
                'role' => UserRole::Admin,
            ]);

            Log::warning('Admin account created', ['user_id' => $admin->id, 'new_admin_id' => $newAdmin->id]);

            // Reload so column defaults (deactivated_at, timestamps) are present on the model.
            return $newAdmin->refresh();
        });
    }
}
