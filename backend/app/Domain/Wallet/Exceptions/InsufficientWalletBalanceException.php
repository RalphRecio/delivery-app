<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;
use App\Domain\Shared\ValueObjects\Money;
use Symfony\Component\HttpFoundation\Response;

/**
 * Raised when a rider below the minimum balance tries to accept a job. The
 * `wallet_balance` error key tells the app to offer a "Top up" shortcut.
 */
final class InsufficientWalletBalanceException extends DomainException
{
    public const string ERROR_KEY = 'wallet_balance';

    public function __construct(Money $balance, Money $minimum)
    {
        parent::__construct(
            "Your wallet balance is {$balance->format()}. Top up to at least {$minimum->format()} to accept jobs.",
        );
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }

    public function errors(): array
    {
        return [self::ERROR_KEY => [$this->getMessage()]];
    }
}
