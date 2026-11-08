<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Http\Responses\ApiResponse;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;

it('returns the signed-in user', function (): void {
    $user = User::factory()->create(['first_name' => 'Cathy', 'last_name' => 'Customer']);
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJson([
            'success' => true,
            'data' => ['id' => $user->id, 'name' => 'Cathy Customer', 'email' => $user->email, 'phone' => $user->phone, 'role' => 'customer'],
        ]);
});

it('requires a token for the session endpoints', function (): void {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
});

it('revokes only the token used to sign out', function (): void {
    $user = User::factory()->create();
    $phoneToken = $user->createToken('ios')->plainTextToken;
    $user->createToken('web');

    $this->withToken($phoneToken)->postJson('/api/v1/auth/logout')
        ->assertOk()
        ->assertJsonPath('message', 'Signed out.');

    expect($user->tokens()->pluck('name')->all())->toBe(['web']);

    // The guard caches the resolved user for the lifetime of the test app;
    // forget it so the next request has to authenticate the token again.
    $this->app['auth']->forgetGuards();

    $this->withToken($phoneToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('keeps each audience area to its own role', function (): void {
    Route::get('/api/v1/_test/rider-only', fn () => ApiResponse::success())
        ->middleware(['auth:sanctum', 'role:rider']);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/v1/_test/rider-only')
        ->assertForbidden()
        ->assertJsonPath('message', 'This area is for rider accounts.');

    Sanctum::actingAs(User::factory()->rider()->create());
    $this->getJson('/api/v1/_test/rider-only')->assertOk();
});
