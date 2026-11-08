<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Store\Models\StoreProduct;
use Illuminate\Http\Request;

/**
 * @mixin StoreProduct
 */
final class StoreProductResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price(),
            'is_available' => $this->is_available,
        ];
    }
}
