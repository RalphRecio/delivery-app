<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Enums\PabiliCategory;
use App\Domain\Booking\Enums\PaymentMethod;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\ValueObjects\GeoPoint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
final class BookingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => User::factory(),
            'service_type' => ServiceType::Pasuyo,
            'status' => BookingStatus::Pending,
            'payment_method' => PaymentMethod::Cash,
            'pickup_address' => 'SM City Cebu, North Reclamation Area',
            'pickup_location' => new GeoPoint(10.3119, 123.9180),
            'dropoff_address' => 'Ayala Center Cebu, Cebu Business Park',
            'dropoff_location' => new GeoPoint(10.3181, 123.9050),
            'distance_meters' => 2100,
            'base_fare_centavos' => 4900,
            'distance_fare_centavos' => 100,
            'service_fee_centavos' => 0,
            'total_fare_centavos' => 5000,
            'recipient_name' => 'Juan dela Cruz',
            'recipient_phone' => '+639171234567',
            'parcel_description' => 'Documents in an envelope',
        ];
    }

    public function pabili(): static
    {
        return $this->state(fn (): array => [
            'service_type' => ServiceType::Pabili,
            'pabili_category' => PabiliCategory::Grocery,
            'items' => [['name' => 'Bottled water 1L', 'quantity' => 2, 'note' => null]],
            'purchase_budget_centavos' => 20000,
            'service_fee_centavos' => 2000,
            'total_fare_centavos' => 7900,
            'recipient_name' => null,
            'recipient_phone' => null,
            'parcel_description' => null,
        ]);
    }

    public function status(BookingStatus $status): static
    {
        return $this->state(fn (): array => ['status' => $status]);
    }
}
