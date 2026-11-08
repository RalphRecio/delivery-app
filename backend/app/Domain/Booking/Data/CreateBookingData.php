<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Booking\Enums\PaymentMethod;
use App\Domain\Booking\Enums\ServiceType;

/** What every booking needs regardless of service type. */
abstract readonly class CreateBookingData
{
    public function __construct(
        /** Null only for a Pabili order from a store, which supplies its own pickup. */
        public ?LocationData $pickup,
        public LocationData $dropoff,
        public PaymentMethod $paymentMethod,
        public ?string $notes,
        /** Client-generated key so a retried request cannot create a second booking. */
        public ?string $idempotencyKey,
    ) {}

    abstract public function serviceType(): ServiceType;

    /**
     * Service-specific columns, ready for Booking::create().
     *
     * @return array<string, mixed>
     */
    abstract public function serviceAttributes(): array;
}
