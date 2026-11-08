<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Auth\Data\AuthSessionData;
use Illuminate\Http\Request;

/**
 * @property-read AuthSessionData $resource
 */
final class AuthSessionResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'token' => $this->resource->token,
            'user' => UserResource::make($this->resource->user),
        ];
    }
}
