<?php

declare(strict_types=1);

namespace App\Domain\Rider\Exceptions;

use App\Domain\Shared\Exceptions\DomainException;

/** No recent location, so "jobs near you" has no "you". */
final class RiderLocationUnknownException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Share your location to see jobs near you.');
    }
}
