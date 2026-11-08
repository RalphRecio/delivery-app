<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Store\Models\Store;
use Illuminate\Http\Request;

/**
 * A store as the admin sees it: everything customers see, plus whether it is
 * active, how many items it has and, on the detail page, every item
 * including sold-out ones.
 *
 * @mixin Store
 */
final class AdminStoreResource extends ApiResource
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
            'is_active' => $this->is_active,
            'products_count' => $this->whenCounted('products'),
            'available_products_count' => $this->when(
                isset($this->resource->available_products_count),
                fn () => (int) $this->resource->available_products_count,
            ),
            'products' => StoreProductResource::collection($this->whenLoaded('products')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
