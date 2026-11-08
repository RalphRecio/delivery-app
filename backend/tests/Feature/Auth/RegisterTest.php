<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\Hash;

function registration(): array
{
    return [
        'first_name' => ' Juan ',
        'last_name' => 'dela Cruz',
        'email' => 'Juan@Example.com',
        'password' => 'correct horse',
        'phone' => '0917 123 4567',
        'device_name' => 'ios',
    ];
}

it('registers a customer and signs them in', function (): void {
    $response = $this->postJson('/api/v1/auth/register', registration())
        ->assertCreated()
        ->assertJsonPath('data.user.first_name', 'Juan')
        ->assertJsonPath('data.user.last_name', 'dela Cruz')
        ->assertJsonPath('data.user.name', 'Juan dela Cruz')
        ->assertJsonPath('data.user.email', 'juan@example.com')
        ->assertJsonPath('data.user.phone', '+639171234567')
        ->assertJsonPath('data.user.role', 'customer')
        ->assertJsonPath('data.user.is_active', true)
        ->assertJsonMissingPath('data.user.password');

    $user = User::query()->where('email', 'juan@example.com')->sole();

    expect($user->role)->toBe(UserRole::Customer)
        ->and(Hash::check('correct horse', $user->password))->toBeTrue()
        ->and($user->tokens()->pluck('name')->all())->toBe(['ios']);

    $this->withToken($response->json('data.token'))->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);
});

it('refuses an email that already has an account, case-insensitively', function (): void {
    User::factory()->create(['email' => 'juan@example.com']);

    $this->postJson('/api/v1/auth/register', registration())
        ->assertStatus(409)
        ->assertJsonPath('errors.email.0', 'That email already has an account.');
});

it('refuses a phone that already has an account', function (): void {
    User::factory()->create(['phone' => '+639171234567']);

    $this->postJson('/api/v1/auth/register', registration())
        ->assertStatus(409)
        ->assertJsonPath('errors.phone.0', 'That number already has an account.');
});

it('validates every field', function (): void {
    $this->postJson('/api/v1/auth/register', [
        'first_name' => '',
        'email' => 'not-an-email',
        'password' => 'short',
        'phone' => '12345',
    ])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['first_name', 'last_name', 'email', 'password', 'phone']]);

    expect(User::query()->count())->toBe(0);
});

it('rate limits registrations per address', function (): void {
    foreach (range(1, 5) as $i) {
        $this->postJson('/api/v1/auth/register', [...registration(), 'email' => "u{$i}@example.com", 'phone' => "091712345{$i}0"])
            ->assertCreated();
    }

    $this->postJson('/api/v1/auth/register', [...registration(), 'email' => 'u6@example.com', 'phone' => '09171234560'])
        ->assertStatus(429);
});

it('registers a rider who starts offline and signs in with email, not phone', function (): void {
    $this->postJson('/api/v1/auth/register', [...registration(), 'account_type' => 'rider'])
        ->assertCreated()
        ->assertJsonPath('data.user.role', 'rider');

    $rider = User::query()->where('email', 'juan@example.com')->sole();

    expect($rider->role)->toBe(UserRole::Rider)
        ->and(App\Domain\Rider\Models\RiderProfile::query()->where('user_id', $rider->id)->sole()->is_online)->toBeFalse();

    $this->app['auth']->forgetGuards();
    $this->postJson('/api/v1/auth/login', ['email' => 'juan@example.com', 'password' => 'correct horse'])
        ->assertCreated()
        ->assertJsonPath('data.user.role', 'rider');
});

it('never lets anyone register as an admin', function (): void {
    $this->postJson('/api/v1/auth/register', [...registration(), 'account_type' => 'admin'])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['account_type']]);

    expect(User::query()->count())->toBe(0);
});
