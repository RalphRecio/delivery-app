<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Actions\DispatchRiderAction;
use App\Domain\Rider\Services\DispatchCandidates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DispatchRiderRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\DispatchCandidateResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** The admin as dispatcher: see who can take a waiting booking, and assign them. */
final class BookingDispatchController extends Controller
{
    use AuthorizesRequests;

    public function candidates(Booking $booking, DispatchCandidates $candidates): AnonymousResourceCollection
    {
        $this->authorize('manage', $booking);

        return DispatchCandidateResource::collection($candidates->forBooking($booking));
    }

    public function assign(DispatchRiderRequest $request, Booking $booking, DispatchRiderAction $dispatch): BookingResource
    {
        $this->authorize('manage', $booking);

        /** @var User $dispatcher role:admin middleware guarantees an admin here */
        $dispatcher = $request->user();

        $assigned = $dispatch->handle($dispatcher, $booking, $request->riderId());

        return BookingResource::make($assigned->load(['customer', 'rider', 'statusLogs']));
    }
}
