<?php

declare(strict_types=1);

namespace App\Http\Requests\Rider;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateAvailabilityRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'is_online' => ['required', 'boolean'],
        ];
    }

    public function isOnline(): bool
    {
        return $this->boolean('is_online');
    }
}
