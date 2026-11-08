<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Rider\Models\RiderProfile;
use Illuminate\Http\Request;

/**
 * @mixin RiderProfile
 */
final class RiderProfileResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'is_online' => $this->is_online,
            'current_location' => $this->current_location,
            'location_updated_at' => $this->location_updated_at?->toIso8601String(),
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
        ];
    }
}
