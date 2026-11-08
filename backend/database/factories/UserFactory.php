<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Date;

/**
 * @extends Factory<User>
 */
final class UserFactory extends Factory
{
    /** Every factory user signs in with this password. */
    public const string PASSWORD = 'password';

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => self::PASSWORD,
            'phone' => '+639'.fake()->unique()->numerify('#########'),
            'role' => UserRole::Customer,
            'deactivated_at' => null,
        ];
    }

    public function rider(): static
    {
        return $this->state(fn (): array => ['role' => UserRole::Rider]);
    }

    public function admin(): static
    {
        return $this->state(fn (): array => ['role' => UserRole::Admin]);
    }

    public function deactivated(): static
    {
        return $this->state(fn (): array => ['deactivated_at' => Date::now()]);
    }
}
