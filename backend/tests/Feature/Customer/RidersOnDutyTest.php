<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Support\Facades\Date;
use Laravel\Sanctum\Sanctum;

function riderWithPresence(bool $isOnline, ?int $secondsSinceSeen, bool $isDeactivated = false): User
{
    $factory = User::factory()->rider();
    $rider = ($isDeactivated ? $factory->deactivated() : $factory)->create();

    RiderProfile::forRider($rider)->forceFill([
        'is_online' => $isOnline,
        'last_seen_at' => $secondsSinceSeen === null ? null : Date::now()->subSeconds($secondsSinceSeen),
    ])->save();

    return $rider;
}

it('counts only riders who are online with the rider app open right now', function (): void {
    config(['app.service_area' => 'Parang, Maguindanao']);

    riderWithPresence(isOnline: true, secondsSinceSeen: 30);       // counted
    riderWithPresence(isOnline: true, secondsSinceSeen: 600);      // closed the app 10 min ago
    riderWithPresence(isOnline: true, secondsSinceSeen: null);     // never opened the app since
    riderWithPresence(isOnline: false, secondsSinceSeen: 10);      // app open, switched off
    riderWithPresence(isOnline: true, secondsSinceSeen: 10, isDeactivated: true);

    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/v1/customer/riders/on-duty')
        ->assertOk()
        ->assertExactJson([
            'success' => true,
            'message' => null,
            'data' => ['service_area' => 'Parang, Maguindanao', 'riders_on_duty' => 1],
            'errors' => [],
        ]);
});

it('counts a rider as soon as they go online, and drops them when they sign out', function (): void {
    $rider = User::factory()->rider()->create();
    $token = $rider->createToken('android')->plainTextToken;
    $customer = User::factory()->create();

    $this->withToken($token)->putJson('/api/v1/rider/availability', ['is_online' => true])->assertOk();
    $this->app['auth']->forgetGuards();

    Sanctum::actingAs($customer);
    $this->getJson('/api/v1/customer/riders/on-duty')->assertJsonPath('data.riders_on_duty', 1);

    $this->app['auth']->forgetGuards();
    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
    $this->app['auth']->forgetGuards();

    Sanctum::actingAs($customer);
    $this->getJson('/api/v1/customer/riders/on-duty')->assertJsonPath('data.riders_on_duty', 0);
});

it('is for customers only', function (): void {
    Sanctum::actingAs(User::factory()->rider()->create());

    $this->getJson('/api/v1/customer/riders/on-duty')->assertForbidden();
});
