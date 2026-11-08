<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Domain\Booking\Data\LocationData;
use App\Domain\Booking\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Fields every booking has. Subclasses add the service-specific ones and
 * build the matching DTO. Note what is NOT here: a fare. The client never
 * sends one; the server computes it.
 */
abstract class StoreBookingRequest extends FormRequest
{
    public const string IDEMPOTENCY_HEADER = 'Idempotency-Key';

    private const int IDEMPOTENCY_KEY_MAX_LENGTH = 64;

    /**
     * @return array<string, list<mixed>>
     */
    protected function commonRules(): array
    {
        return [
            ...LocationRules::for('pickup', withAddress: true),
            ...LocationRules::for('dropoff', withAddress: true),
            'payment_method' => ['sometimes', Rule::enum(PaymentMethod::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function pickup(): LocationData
    {
        return LocationRules::location($this, 'pickup');
    }

    protected function dropoff(): LocationData
    {
        return LocationRules::location($this, 'dropoff');
    }

    protected function paymentMethod(): PaymentMethod
    {
        return PaymentMethod::from($this->string('payment_method', PaymentMethod::Cash->value)->toString());
    }

    protected function notes(): ?string
    {
        $notes = trim($this->string('notes')->toString());

        return $notes === '' ? null : $notes;
    }

    /** Read from the header, trimmed to a sane length; absent means "no replay protection". */
    protected function idempotencyKey(): ?string
    {
        $key = trim((string) $this->header(self::IDEMPOTENCY_HEADER, ''));

        if ($key === '' || strlen($key) > self::IDEMPOTENCY_KEY_MAX_LENGTH) {
            return null;
        }

        return $key;
    }
}
