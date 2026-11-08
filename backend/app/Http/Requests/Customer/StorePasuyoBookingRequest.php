<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Domain\Booking\Data\CreatePasuyoBookingData;
use App\Domain\Shared\ValueObjects\PhoneNumber;
use App\Rules\PhilippineMobileNumber;

final class StorePasuyoBookingRequest extends StoreBookingRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->commonRules(),
            'recipient_name' => ['required', 'string', 'max:120'],
            'recipient_phone' => ['required', 'string', 'max:20', new PhilippineMobileNumber],
            'parcel_description' => ['required', 'string', 'max:300'],
        ];
    }

    public function toData(): CreatePasuyoBookingData
    {
        return new CreatePasuyoBookingData(
            pickup: $this->pickup(),
            dropoff: $this->dropoff(),
            paymentMethod: $this->paymentMethod(),
            notes: $this->notes(),
            idempotencyKey: $this->idempotencyKey(),
            recipientName: $this->string('recipient_name')->toString(),
            recipientPhone: PhoneNumber::fromString($this->string('recipient_phone')->toString()),
            parcelDescription: $this->string('parcel_description')->toString(),
        );
    }
}
