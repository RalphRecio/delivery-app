<?php

declare(strict_types=1);

namespace App\Domain\Rider\Exceptions;

use App\Domain\Rider\Data\DispatchCandidateData;
use App\Domain\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/** The dispatcher picked a rider who cannot take the job right now. */
final class RiderNotDispatchableException extends DomainException
{
    public static function notARider(): self
    {
        return new self('That user is not an active rider.');
    }

    public static function unavailable(DispatchCandidateData $candidate): self
    {
        return new self("{$candidate->rider->name} can't take this job: {$candidate->unavailableReason()}.");
    }

    public function httpStatus(): int
    {
        return Response::HTTP_CONFLICT;
    }

    public function errors(): array
    {
        return ['rider_id' => [$this->getMessage()]];
    }
}
