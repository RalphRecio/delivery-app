<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Booking\Data\FareQuoteData;
use Illuminate\Http\Request;

/**
 * @property-read FareQuoteData $resource
 */
final class FareQuoteResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'service_type' => $this->resource->serviceType->value,
            'pickup' => $this->resource->pickup,
            'dropoff' => $this->resource->dropoff,
            'fare' => $this->resource->fare,
        ];
    }
}
