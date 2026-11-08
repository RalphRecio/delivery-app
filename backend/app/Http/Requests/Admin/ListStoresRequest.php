<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class ListStoresRequest extends FormRequest
{
    use PaginatesLists;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:60'],
            ...$this->paginationRules(),
        ];
    }

    public function search(): ?string
    {
        $term = trim($this->string('search')->toString());

        return $term === '' ? null : $term;
    }
}
