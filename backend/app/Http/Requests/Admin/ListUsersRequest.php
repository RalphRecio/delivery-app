<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListUsersRequest extends FormRequest
{
    use PaginatesLists;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'role' => ['sometimes', Rule::enum(UserRole::class)],
            'search' => ['sometimes', 'string', 'max:40'],
            ...$this->paginationRules(),
        ];
    }

    public function role(): ?UserRole
    {
        return $this->has('role') ? UserRole::from($this->string('role')->toString()) : null;
    }

    public function search(): ?string
    {
        $term = trim($this->string('search')->toString());

        return $term === '' ? null : $term;
    }
}
