<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Auth\Models\User;
use Illuminate\Http\Request;

/**
 * A rider as the admin sees them: account plus availability.
 *
 * @mixin User
 */
final class RiderResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Lazily created on first rider use, so an admin-created rider who has never signed in has none yet.
        $profile = $this->resource->riderProfile;

        return [
            ...UserResource::make($this->resource)->toArray($request),
            'is_online' => $profile !== null && $profile->is_online,
            'current_location' => $profile?->current_location,
            'location_updated_at' => $profile?->location_updated_at?->toIso8601String(),
            'active_job_reference' => $this->when(
                isset($this->resource->active_job_reference),
                fn () => $this->resource->active_job_reference,
            ),
        ];
    }
}
