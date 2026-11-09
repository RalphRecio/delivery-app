<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Models\RiderProfile;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->admin = User::factory()->admin()->create();
    Sanctum::actingAs($this->admin);
});

function riderPayload(): array
{
    return [
        'first_name' => 'Rita',
        'last_name' => 'Rider',
        'email' => 'Rita@Example.com',
        'phone' => '0917 555 0001',
        'password' => 'first-password',
    ];
}

it('creates a rider account with a profile, ready to sign in', function (): void {
    $this->postJson('/api/v1/admin/riders', riderPayload())
        ->assertCreated()
        ->assertJsonPath('data.role', 'rider')
        ->assertJsonPath('data.name', 'Rita Rider')
        ->assertJsonPath('data.email', 'rita@example.com')
        ->assertJsonPath('data.phone', '+639175550001')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonMissingPath('data.password');

    $rider = User::query()->where('phone', '+639175550001')->sole();

    expect($rider->role)->toBe(UserRole::Rider)
        ->and(RiderProfile::query()->where('user_id', $rider->id)->exists())->toBeTrue();

    $this->app['auth']->forgetGuards();
    $this->postJson('/api/v1/auth/login', ['email' => 'rita@example.com', 'password' => 'first-password'])
        ->assertCreated()
        ->assertJsonPath('data.user.role', 'rider');
});

it('refuses an email or number that already has an account', function (): void {
    User::factory()->create(['email' => 'rita@example.com']);

    $this->postJson('/api/v1/admin/riders', riderPayload())
        ->assertStatus(409)
        ->assertJsonPath('errors.email.0', 'That email already has an account.');

    User::factory()->create(['phone' => '+639175550001']);

    $this->postJson('/api/v1/admin/riders', [...riderPayload(), 'email' => 'other@example.com'])
        ->assertStatus(409)
        ->assertJsonPath('errors.phone.0', 'That number already has an account.');
});

it('requires a password of at least 8 characters for a new rider', function (): void {
    $this->postJson('/api/v1/admin/riders', [...riderPayload(), 'password' => 'short'])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['password']]);
});

it('lists users filtered by role and search', function (): void {
    User::factory()->create(['first_name' => 'Cathy', 'last_name' => 'Customer', 'phone' => '+639170000003']);
    User::factory()->rider()->create(['first_name' => 'Rico', 'last_name' => 'Rider', 'phone' => '+639170000002']);

    $this->getJson('/api/v1/admin/users?role=rider')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Rico Rider');

    $this->getJson('/api/v1/admin/users?search=0003')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Cathy Customer');

    $this->getJson('/api/v1/admin/users?search=cathy%20cust')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Cathy Customer');

    $this->getJson('/api/v1/admin/users?role=pilot')->assertUnprocessable();
});

it('lists riders with availability and their active job', function (): void {
    $busy = User::factory()->rider()->create(['first_name' => 'Busy', 'last_name' => 'Rider']);
    RiderProfile::forRider($busy)->forceFill(['is_online' => true])->save();
    $job = Booking::factory()->status(BookingStatus::InTransit)->create(['rider_id' => $busy->id]);
    User::factory()->rider()->create(['first_name' => 'Idle', 'last_name' => 'Rider']);

    $response = $this->getJson('/api/v1/admin/riders')->assertOk()->assertJsonCount(2, 'data');
    $rows = collect($response->json('data'))->keyBy('name');

    expect($rows['Busy Rider']['is_online'])->toBeTrue()
        ->and($rows['Busy Rider']['active_job_reference'])->toBe($job->reference)
        ->and($rows['Idle Rider']['is_online'])->toBeFalse()
        ->and($rows['Idle Rider'])->not->toHaveKey('active_job_reference');
});

it('deactivates a rider: tokens revoked, taken offline, cannot sign in or call the API', function (): void {
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill(['is_online' => true])->save();
    $token = $rider->createToken('ios')->plainTextToken;

    $this->postJson("/api/v1/admin/users/{$rider->id}/deactivate")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($rider->tokens()->count())->toBe(0)
        ->and(RiderProfile::forRider($rider)->is_online)->toBeFalse();

    $this->app['auth']->forgetGuards();
    $this->withToken($token)->getJson('/api/v1/rider/profile')->assertUnauthorized();

    $this->postJson('/api/v1/auth/login', ['email' => $rider->email, 'password' => 'password'])
        ->assertForbidden()
        ->assertJsonPath('message', 'This account has been deactivated. Contact support.');
});

it('reactivates a user', function (): void {
    $user = User::factory()->deactivated()->create();

    $this->postJson("/api/v1/admin/users/{$user->id}/reactivate")
        ->assertOk()
        ->assertJsonPath('data.is_active', true);
});

it('blocks a deactivated user who still holds a token', function (): void {
    $customer = User::factory()->deactivated()->create();
    Sanctum::actingAs($customer);

    $this->getJson('/api/v1/customer/bookings')
        ->assertForbidden()
        ->assertJsonPath('message', 'This account has been deactivated. Contact support.');
});

function adminPayload(): array
{
    return [
        'first_name' => 'Amy',
        'last_name' => 'Admin',
        'email' => 'Amy@Example.com',
        'phone' => '0917 555 0009',
        'password' => 'long-enough-pass-42',
    ];
}

it('creates an admin account that can sign in as an admin', function (): void {
    $this->postJson('/api/v1/admin/admins', adminPayload())
        ->assertCreated()
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonPath('data.name', 'Amy Admin')
        ->assertJsonPath('data.email', 'amy@example.com')
        ->assertJsonPath('data.phone', '+639175550009')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonMissingPath('data.password');

    $this->app['auth']->forgetGuards();
    $this->postJson('/api/v1/auth/login', ['email' => 'amy@example.com', 'password' => 'long-enough-pass-42'])
        ->assertCreated()
        ->assertJsonPath('data.user.role', 'admin');
});

it('never changes an existing account from the new admin form', function (): void {
    $customer = User::factory()->create(['email' => 'amy@example.com']);

    $this->postJson('/api/v1/admin/admins', adminPayload())
        ->assertStatus(409)
        ->assertJsonPath('errors.email.0', 'That email belongs to a customer. Use "Make admin" on the Customers tab instead.');

    User::factory()->rider()->create(['email' => 'rico@example.com']);

    $this->postJson('/api/v1/admin/admins', [...adminPayload(), 'email' => 'rico@example.com'])
        ->assertStatus(409)
        ->assertJsonPath('errors.email.0', 'That email already has an account.');

    User::factory()->create(['phone' => '+639175550009']);

    $this->postJson('/api/v1/admin/admins', [...adminPayload(), 'email' => 'other@example.com'])
        ->assertStatus(409)
        ->assertJsonPath('errors.phone.0', 'That number already has an account.');

    expect($customer->refresh()->role)->toBe(UserRole::Customer)
        ->and(User::query()->where('role', UserRole::Admin)->count())->toBe(1);
});

it('requires a 12-character admin password with letters and numbers', function (string $password): void {
    $this->postJson('/api/v1/admin/admins', [...adminPayload(), 'password' => $password])
        ->assertUnprocessable()
        ->assertJsonStructure(['errors' => ['password']]);
})->with(['short1', 'no-numbers-at-all', '123456789012345']);

it('lets only admins create admins', function (UserRole $role): void {
    Sanctum::actingAs(User::factory()->create(['role' => $role]));

    $this->postJson('/api/v1/admin/admins', adminPayload())->assertForbidden();

    expect(User::query()->where('email', 'amy@example.com')->exists())->toBeFalse();
})->with([UserRole::Customer, UserRole::Rider]);

it('makes a customer an admin who keeps their password and signs in again', function (): void {
    $customer = User::factory()->create(['email' => 'staff@example.com', 'password' => 'their-own-pass']);
    $customer->createToken('web');

    $this->postJson("/api/v1/admin/users/{$customer->id}/make-admin")
        ->assertOk()
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonPath('data.email', 'staff@example.com');

    expect($customer->refresh()->role)->toBe(UserRole::Admin)
        ->and($customer->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->postJson('/api/v1/auth/login', ['email' => 'staff@example.com', 'password' => 'their-own-pass'])
        ->assertCreated()
        ->assertJsonPath('data.user.role', 'admin');
});

it('only makes customers admins', function (): void {
    $rider = User::factory()->rider()->create();

    $this->postJson("/api/v1/admin/users/{$rider->id}/make-admin")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Only customer accounts can be made admins.');

    expect($rider->refresh()->role)->toBe(UserRole::Rider);
});

it('waits until the customer has no booking in progress', function (): void {
    $customer = User::factory()->create();
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create(['customer_id' => $customer->id]);

    $this->postJson("/api/v1/admin/users/{$customer->id}/make-admin")
        ->assertStatus(409)
        ->assertJsonPath('message', 'This customer has a booking in progress. Make them an admin after it is finished or cancelled.');

    expect($customer->refresh()->role)->toBe(UserRole::Customer);

    $booking->forceFill(['status' => BookingStatus::Completed])->save();

    $this->postJson("/api/v1/admin/users/{$customer->id}/make-admin")->assertOk();
});

it('lets only admins make admins', function (): void {
    $customer = User::factory()->create();
    Sanctum::actingAs(User::factory()->create());

    $this->postJson("/api/v1/admin/users/{$customer->id}/make-admin")->assertForbidden();

    expect($customer->refresh()->role)->toBe(UserRole::Customer);
});
