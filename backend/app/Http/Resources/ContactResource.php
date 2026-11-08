<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Auth\Models\User;
use Illuminate\Http\Request;

/**
 * The other party on a booking, as seen by the customer (their rider) or
 * the rider (their customer): just enough to recognise and call them.
 *
 * @mixin User
 */
final class ContactResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
        ];
    }
}
