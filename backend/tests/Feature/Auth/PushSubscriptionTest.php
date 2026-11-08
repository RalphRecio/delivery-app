<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Notification\Notifications\PushMessageNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use NotificationChannels\WebPush\WebPushChannel;

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';

function subscriptionPayload(): array
{
    return ['endpoint' => ENDPOINT, 'keys' => ['p256dh' => 'p256dh-key', 'auth' => 'auth-token']];
}

it('exposes the VAPID public key without signing in', function (): void {
    config()->set('webpush.vapid.public_key', 'public-key');

    $this->getJson('/api/v1/auth/push/public-key')->assertOk()->assertJsonPath('data.public_key', 'public-key');
});

it('saves a browser subscription once per endpoint', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/auth/push-subscriptions', subscriptionPayload())->assertOk();
    $this->postJson('/api/v1/auth/push-subscriptions', [...subscriptionPayload(), 'keys' => ['p256dh' => 'new-key', 'auth' => 'new-token']])->assertOk();

    expect($user->pushSubscriptions()->count())->toBe(1)
        ->and($user->pushSubscriptions()->first()?->public_key)->toBe('new-key');
});

it('removes a subscription by endpoint', function (): void {
    $user = User::factory()->create();
    $user->updatePushSubscription(ENDPOINT, 'key', 'token');
    Sanctum::actingAs($user);

    $this->deleteJson('/api/v1/auth/push-subscriptions', ['endpoint' => ENDPOINT])->assertOk();

    expect($user->pushSubscriptions()->count())->toBe(0);
});

it('validates the subscription shape', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/v1/auth/push-subscriptions', ['endpoint' => 'not-a-url'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['endpoint', 'keys']);
});

it('requires a token', function (): void {
    $this->postJson('/api/v1/auth/push-subscriptions', subscriptionPayload())->assertUnauthorized();
    $this->deleteJson('/api/v1/auth/push-subscriptions', ['endpoint' => ENDPOINT])->assertUnauthorized();
});

it('sends a test push to a subscribed user from the console', function (): void {
    Notification::fake();
    $user = User::factory()->create(['email' => 'cathy@example.com']);
    $user->updatePushSubscription(ENDPOINT, 'key', 'token');

    $this->artisan('push:test', ['email' => 'cathy@example.com', '--title' => 'Hello', '--body' => 'From tinker', '--url' => '/customer'])
        ->expectsOutputToContain('Sent to 1 device')
        ->assertSuccessful();

    Notification::assertSentTo($user, PushMessageNotification::class, function (PushMessageNotification $notification, array $channels) use ($user): bool {
        $message = $notification->toWebPush($user, $notification)->toArray();

        return $channels === [WebPushChannel::class]
            && $message['title'] === 'Hello'
            && $message['body'] === 'From tinker'
            && $message['data'] === ['url' => '/customer'];
    });
});

it('refuses to send when the user has no subscribed browser', function (): void {
    Notification::fake();
    User::factory()->create(['email' => 'nobody@example.com']);

    $this->artisan('push:test', ['email' => 'nobody@example.com'])->assertFailed();

    Notification::assertNothingSent();
});
