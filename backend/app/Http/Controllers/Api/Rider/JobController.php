<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Rider;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Models\Booking;
use App\Domain\Rider\Actions\AcceptBookingOfferAction;
use App\Domain\Rider\Actions\ProgressBookingAction;
use App\Domain\Rider\Services\RiderMatcher;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rider\ProgressJobRequest;
use App\Http\Resources\BookingResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class JobController extends Controller
{
    use AuthorizesRequests;

    private const int HISTORY_PER_PAGE = 20;

    /** Bookings the rider could accept right now, nearest first. */
    public function available(Request $request, RiderMatcher $matcher): AnonymousResourceCollection
    {
        return BookingResource::collection($matcher->availableJobsFor($this->rider($request)));
    }

    /** The job in progress, or `data: null` when the rider is free. */
    public function active(Request $request, RiderMatcher $matcher): BookingResource|JsonResponse
    {
        $booking = $matcher->activeJobFor($this->rider($request));

        if ($booking === null) {
            return ApiResponse::success(null);
        }

        return BookingResource::make($booking->load('statusLogs'));
    }

    /** Everything this rider has ever taken, newest first. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $jobs = Booking::query()
            ->with('customer')
            ->where('rider_id', $this->rider($request)->id)
            ->latest('id')
            ->paginate(self::HISTORY_PER_PAGE);

        return BookingResource::collection($jobs);
    }

    public function show(Request $request, Booking $booking): BookingResource
    {
        $this->authorize('viewAsRider', $booking);

        return BookingResource::make($booking->load(['customer', 'store', 'statusLogs']));
    }

    public function accept(Request $request, Booking $booking, AcceptBookingOfferAction $acceptOffer): BookingResource
    {
        $this->authorize('accept', $booking);

        $accepted = $acceptOffer->handle($this->rider($request), $booking);

        return BookingResource::make($accepted->load(['customer', 'statusLogs']));
    }

    public function progress(ProgressJobRequest $request, Booking $booking, ProgressBookingAction $progressBooking): BookingResource
    {
        $this->authorize('progress', $booking);

        $updated = $progressBooking->handle($this->rider($request), $booking, $request->status());

        return BookingResource::make($updated->load(['customer', 'statusLogs']));
    }

    private function rider(Request $request): User
    {
        /** @var User $user role:rider middleware guarantees a rider here */
        $user = $request->user();

        return $user;
    }
}
