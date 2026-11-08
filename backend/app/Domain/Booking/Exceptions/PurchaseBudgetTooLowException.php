<?php

declare(strict_types=1);

namespace App\Domain\Booking\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use App\Domain\Shared\ValueObjects\Money;

/** The rider cannot buy ₱500 of goods with a ₱300 budget. */
final class PurchaseBudgetTooLowException extends DomainException
{
    public function __construct(Money $subtotal)
    {
        parent::__construct("The purchase budget must cover the listed products ({$subtotal->format()}).");
    }

    public function errors(): array
    {
        return ['purchase_budget' => [$this->getMessage()]];
    }
}
