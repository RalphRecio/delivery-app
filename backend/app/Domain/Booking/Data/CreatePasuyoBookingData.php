<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Booking\Enums\PaymentMethod;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\ValueObjects\PhoneNumber;

final readonly class CreatePasuyoBookingData extends CreateBookingData
{
    public function __construct(
        LocationData $pickup,
        LocationData $dropoff,
        PaymentMethod $paymentMethod,
        ?string $notes,
        ?string $idempotencyKey,
        public string $recipientName,
        public PhoneNumber $recipientPhone,
        public string $parcelDescription,
    ) {
        parent::__construct($pickup, $dropoff, $paymentMethod, $notes, $idempotencyKey);
    }

    public function serviceType(): ServiceType
    {
        return ServiceType::Pasuyo;
    }

    public function serviceAttributes(): array
    {
        return [
            'recipient_name' => $this->recipientName,
            'recipient_phone' => $this->recipientPhone->value,
            'parcel_description' => $this->parcelDescription,
        ];
    }
}
