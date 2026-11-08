<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/**
 * `page` and `per_page` for admin lists. Laravel reads `page` itself; this
 * validates both and caps the page size so a client cannot ask for everything.
 */
trait PaginatesLists
{
    private const int DEFAULT_PER_PAGE = 25;

    private const int MAX_PER_PAGE = 100;

    /**
     * @return array<string, list<mixed>>
     */
    protected function paginationRules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:'.self::MAX_PER_PAGE],
        ];
    }

    public function perPage(): int
    {
        return $this->has('per_page') ? $this->integer('per_page') : self::DEFAULT_PER_PAGE;
    }
}
