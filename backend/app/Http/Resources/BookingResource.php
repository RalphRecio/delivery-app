<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Booking\Models\Booking;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Http\Request;

/**
 * @mixin Booking
 */
final class BookingResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'service_type' => $this->service_type->value,
            'service_label' => $this->serviceLabel(),
            'pabili_category' => $this->pabili_category?->value,
            'pabili_category_label' => $this->pabili_category?->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'can_cancel' => $this->status->isCancellableByCustomer(),
            'payment_method' => $this->payment_method->value,
            'pickup' => [
                'address' => $this->pickup_address,
                'landmark' => $this->pickup_landmark,
                'details' => $this->pickup_details,
                'point' => $this->pickup_location,
            ],
            'dropoff' => [
                'address' => $this->dropoff_address,
                'landmark' => $this->dropoff_landmark,
                'details' => $this->dropoff_details,
                'point' => $this->dropoff_location,
            ],
            'fare' => [
                'distance_meters' => $this->distance_meters,
                'base_fare' => Money::fromCentavos($this->base_fare_centavos),
                'distance_fare' => Money::fromCentavos($this->distance_fare_centavos),
                'service_fee' => Money::fromCentavos($this->service_fee_centavos),
                'total' => $this->totalFare(),
            ],
            'notes' => $this->notes,
            'items' => $this->items,
            'items_subtotal' => $this->itemsSubtotal(),
            'purchase_budget' => $this->purchaseBudget(),
            'store' => StoreResource::make($this->whenLoaded('store')),
            'recipient_name' => $this->recipient_name,
            'recipient_phone' => $this->recipient_phone,
            'parcel_description' => $this->parcel_description,
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'search_radius_meters' => $this->search_radius_meters,
            'distance_to_pickup_meters' => $this->when(
                isset($this->resource->distance_to_pickup_meters),
                fn () => (int) round((float) $this->resource->distance_to_pickup_meters),
            ),
            'customer' => ContactResource::make($this->whenLoaded('customer')),
            'rider' => ContactResource::make($this->whenLoaded('rider')),
            'rider_location' => $this->when(
                $this->isRiderLocationLoaded(),
                fn () => $this->riderLocation(),
            ),
            'status_logs' => BookingStatusLogResource::collection($this->whenLoaded('statusLogs')),
        ];
    }

    /**
     * Only present where the endpoint loaded the rider's profile (the
     * customer's own booking). Null outside an active job or before the
     * rider app has reported a position.
     *
     * @return array{latitude: float, longitude: float, updated_at: string}|null
     */
    private function riderLocation(): ?array
    {
        $profile = $this->rider?->riderProfile;

        if (! $this->status->isRiderTrackable() || $profile?->current_location === null || $profile->location_updated_at === null) {
            return null;
        }

        return [
            'latitude' => $profile->current_location->latitude,
            'longitude' => $profile->current_location->longitude,
            'updated_at' => $profile->location_updated_at->toIso8601String(),
        ];
    }

    private function isRiderLocationLoaded(): bool
    {
        return $this->resource->relationLoaded('rider')
            && ($this->rider === null || $this->rider->relationLoaded('riderProfile'));
    }

    /** "Pabili · Food takeout", "Pasuyo": one line that names the booking anywhere it is listed. */
    private function serviceLabel(): string
    {
        $label = $this->service_type->label();

        return $this->pabili_category === null ? $label : "{$label} · {$this->pabili_category->label()}";
    }
}
