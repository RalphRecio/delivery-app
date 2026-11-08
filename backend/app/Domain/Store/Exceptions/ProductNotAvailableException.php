<?php

declare(strict_types=1);

namespace App\Domain\Store\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

/** The item is not on this store's menu any more, or was never on it. */
final class ProductNotAvailableException extends DomainException
{
    public function __construct(int $productId)
    {
        parent::__construct("Product #{$productId} is not available from this store.");
    }

    public function errors(): array
    {
        return ['items' => [$this->getMessage()]];
    }
}
