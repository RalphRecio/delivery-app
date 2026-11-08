<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Base class for every API resource. Wraps the resource in the standard
 * envelope so single resources and collections look the same as ApiResponse.
 */
abstract class ApiResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return ApiResourceCollection::envelope();
    }

    /**
     * @param  mixed  $resource
     */
    protected static function newCollection($resource): ApiResourceCollection
    {
        return new ApiResourceCollection($resource, static::class);
    }
}
