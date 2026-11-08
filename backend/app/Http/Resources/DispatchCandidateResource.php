<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Rider\Data\DispatchCandidateData;
use Illuminate\Http\Request;

/**
 * @property-read DispatchCandidateData $resource
 */
final class DispatchCandidateResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'rider' => ContactResource::make($this->resource->rider),
            'is_on_duty' => $this->resource->isOnDuty,
            'distance_to_pickup_meters' => $this->resource->distanceToPickupMeters,
            'location_updated_at' => $this->resource->locationUpdatedAt?->toIso8601String(),
            'active_job_reference' => $this->resource->activeJobReference,
            'wallet_balance' => $this->resource->walletBalance,
            'is_available' => $this->resource->isAvailable(),
            'unavailable_reason' => $this->resource->unavailableReason(),
        ];
    }
}
