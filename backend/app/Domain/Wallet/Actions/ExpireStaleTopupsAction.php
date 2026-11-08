<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Actions;

use App\Domain\Wallet\Enums\TopupStatus;
use App\Domain\Wallet\Models\TopupRequest;
use Illuminate\Support\Facades\Date;

/** Marks unpaid top-ups past their window as expired. A late payment still credits. */
final readonly class ExpireStaleTopupsAction
{
    public function handle(): int
    {
        return TopupRequest::query()
            ->where('status', TopupStatus::Pending)
            ->where('expires_at', '<=', Date::now())
            ->update(['status' => TopupStatus::Expired, 'updated_at' => Date::now()]);
    }
}
