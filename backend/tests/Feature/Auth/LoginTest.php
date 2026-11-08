<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use Database\Factories\UserFactory;

it('signs in with email and password and issues a token per device', function (): void {
    $user = User::factory()->create(['email' => 'cathy@example.com']);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'Cathy@Example.com',
        'password' => UserFactory::PASSWORD,
        'device_name' => 'android',
    ])
        ->assertCreated()
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.role', 'customer');

    expect($user->tokens()->pluck('name')->all())->toBe(['android']);

    $this->withToken($response->json('data.token'))->getJson('/api/v1/auth/me')->assertOk();
});

it('answers the same way for a wrong password and an unknown email', function (): void {
    User::factory()->create(['email' => 'cathy@example.com']);

    foreach (['cathy@example.com', 'nobody@example.com'] as $email) {
        $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Email or password is incorrect.');
    }
});

it('refuses a deactivated account', function (): void {
    User::factory()->deactivated()->create(['email' => 'gone@example.com']);

    $this->postJson('/api/v1/auth/login', ['email' => 'gone@example.com', 'password' => UserFactory::PASSWORD])
        ->assertForbidden()
        ->assertJsonPath('message', 'This account has been deactivated. Contact support.');
});

it('rate limits attempts per email and address', function (): void {
    foreach (range(1, 10) as $i) {
        $this->postJson('/api/v1/auth/login', ['email' => 'cathy@example.com', 'password' => 'wrong'])
            ->assertUnprocessable();
    }

    $this->postJson('/api/v1/auth/login', ['email' => 'cathy@example.com', 'password' => 'wrong'])
        ->assertStatus(429);

    // A different account from the same address is not locked out.
    $this->postJson('/api/v1/auth/login', ['email' => 'other@example.com', 'password' => 'wrong'])
        ->assertUnprocessable();
});

it('signs each role in only on its own page', function (): void {
    User::factory()->rider()->create(['email' => 'rico@example.com']);

    $this->postJson('/api/v1/auth/login', ['email' => 'rico@example.com', 'password' => UserFactory::PASSWORD, 'portal' => 'customer'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'This is a rider account. Sign in on the rider sign-in page.');

    $this->postJson('/api/v1/auth/login', ['email' => 'rico@example.com', 'password' => UserFactory::PASSWORD, 'portal' => 'admin'])
        ->assertUnprocessable();

    expect(User::query()->where('email', 'rico@example.com')->sole()->tokens()->count())->toBe(0);

    $this->postJson('/api/v1/auth/login', ['email' => 'rico@example.com', 'password' => UserFactory::PASSWORD, 'portal' => 'rider'])
        ->assertCreated()
        ->assertJsonPath('data.user.role', 'rider');
});

it('does not reveal the account type to a wrong password', function (): void {
    User::factory()->rider()->create(['email' => 'rico@example.com']);

    $this->postJson('/api/v1/auth/login', ['email' => 'rico@example.com', 'password' => 'wrong', 'portal' => 'customer'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'Email or password is incorrect.');
});
