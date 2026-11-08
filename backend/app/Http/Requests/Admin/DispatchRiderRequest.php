<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class DispatchRiderRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        // Whether the id belongs to an on-duty rider is a business rule, checked by the action.
        return [
            'rider_id' => ['required', 'integer', 'min:1'],
        ];
    }

    public function riderId(): int
    {
        return $this->integer('rider_id');
    }
}
