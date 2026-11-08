<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Enums\ServiceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListBookingsRequest extends FormRequest
{
    use PaginatesLists;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::enum(BookingStatus::class)],
            'service_type' => ['sometimes', Rule::enum(ServiceType::class)],
            'search' => ['sometimes', 'string', 'max:40'],
            ...$this->paginationRules(),
        ];
    }

    public function status(): ?BookingStatus
    {
        return $this->has('status') ? BookingStatus::from($this->string('status')->toString()) : null;
    }

    public function serviceType(): ?ServiceType
    {
        return $this->has('service_type') ? ServiceType::from($this->string('service_type')->toString()) : null;
    }

    public function search(): ?string
    {
        $term = trim($this->string('search')->toString());

        return $term === '' ? null : $term;
    }
}
