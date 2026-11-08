<?php

declare(strict_types=1);

namespace App\Http\Requests\Rider;

use App\Domain\Booking\Enums\BookingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ProgressJobRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                BookingStatus::PickingUp->value,
                BookingStatus::InTransit->value,
                BookingStatus::Completed->value,
            ])],
        ];
    }

    public function status(): BookingStatus
    {
        return BookingStatus::from($this->string('status')->toString());
    }
}
