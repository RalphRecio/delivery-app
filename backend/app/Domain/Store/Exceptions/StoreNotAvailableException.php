<?php

declare(strict_types=1);

namespace App\Domain\Store\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

final class StoreNotAvailableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('This store is not taking orders right now.');
    }

    public function errors(): array
    {
        return ['store_id' => [$this->getMessage()]];
    }
}
