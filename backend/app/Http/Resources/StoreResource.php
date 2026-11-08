<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Store\Models\Store;
use Illuminate\Http\Request;

/**
 * @mixin Store
 */
final class StoreResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'address' => $this->address,
            'landmark' => $this->landmark,
            'location' => $this->location,
            'distance_meters' => $this->when(
                isset($this->resource->distance_meters),
                fn () => (int) round((float) $this->resource->distance_meters),
            ),
            'products' => StoreProductResource::collection($this->whenLoaded('products')),
        ];
    }
}
