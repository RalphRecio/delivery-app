<?php

declare(strict_types=1);

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Data\DispatchCandidateData;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Data\WalletSettings;
use App\Domain\Wallet\Models\WalletTransaction;
use Laravel\Sanctum\Sanctum;

// ADR 0021: with the wallet off, riders work without a balance.
beforeEach(function (): void {
    config()->set('wallet.enabled', false);
    app()->forgetInstance(WalletSettings::class);
});

function onlineRiderWithEmptyWallet(): User
{
    $rider = User::factory()->rider()->create();
    RiderProfile::forRider($rider)->forceFill(['is_online' => true])->save();

    return $rider;
}

it('lets a rider with an empty wallet accept a job', function (): void {
    $rider = onlineRiderWithEmptyWallet();
    $booking = Booking::factory()->status(BookingStatus::Searching)->create();
    Sanctum::actingAs($rider);

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/accept")->assertOk();
});

it('charges no commission when a cash booking completes', function (): void {
    $rider = onlineRiderWithEmptyWallet();
    $booking = Booking::factory()->status(BookingStatus::InTransit)->create([
        'rider_id' => $rider->id, 'total_fare_centavos' => 7900, 'commission_rate_bps' => 1000,
    ]);
    Sanctum::actingAs($rider);

    $this->postJson("/api/v1/rider/jobs/{$booking->id}/status", ['status' => 'completed'])->assertOk();

    expect(WalletTransaction::query()->where('booking_id', $booking->id)->exists())->toBeFalse();
});

it('does not mark a dispatch candidate unavailable for a low balance', function (): void {
    $candidate = new DispatchCandidateData(
        rider: User::factory()->rider()->make(),
        isOnDuty: true,
        distanceToPickupMeters: 500,
        locationUpdatedAt: null,
        activeJobReference: null,
        walletBalance: Money::zero(),
        minimumBalance: null,
    );

    expect($candidate->isAvailable())->toBeTrue();
});
