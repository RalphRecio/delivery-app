<?php

declare(strict_types=1);

namespace App\Domain\Rider\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Exceptions\RiderNotOnlineException;
use App\Domain\Rider\Models\RiderProfile;
use App\Domain\Rider\Services\RiderAssigner;
use App\Domain\Wallet\Services\WalletService;

/**
 * A rider takes an open job themselves. The assigner locks the rows so only
 * the first rider to accept gets the job; everyone else receives
 * BookingAlreadyAcceptedException.
 */
final readonly class AcceptBookingOfferAction
{
    public function __construct(
        private RiderAssigner $assigner,
        private WalletService $wallets,
    ) {}

    public function handle(User $rider, Booking $booking): Booking
    {
        if (! RiderProfile::forRider($rider)->is_online) {
            throw new RiderNotOnlineException;
        }

        // Commission is collected from the wallet on completion, so a rider
        // needs the minimum balance before taking a cash job.
        $this->wallets->assertCanAcceptBookings($rider);

        return $this->assigner->assign($rider, $booking, actor: $rider);
    }
}
