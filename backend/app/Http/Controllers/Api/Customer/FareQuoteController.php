<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Customer;

use App\Domain\Booking\Actions\QuoteFareAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\QuoteFareRequest;
use App\Http\Resources\FareQuoteResource;

final class FareQuoteController extends Controller
{
    public function __invoke(QuoteFareRequest $request, QuoteFareAction $quoteFare): FareQuoteResource
    {
        $quote = $quoteFare->handle($request->serviceType(), $request->pickup(), $request->dropoff());

        return FareQuoteResource::make($quote);
    }
}
