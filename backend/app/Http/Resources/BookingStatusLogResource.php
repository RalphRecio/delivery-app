<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Booking\Models\BookingStatusLog;
use Illuminate\Http\Request;

/**
 * @mixin BookingStatusLog
 */
final class BookingStatusLogResource extends ApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'from_status' => $this->from_status?->value,
            'to_status' => $this->to_status->value,
            'to_status_label' => $this->to_status->label(),
            'reason' => $this->reason,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
