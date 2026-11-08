<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Customer;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Actions\CancelBookingAction;
use App\Domain\Booking\Actions\CreateBookingAction;
use App\Domain\Booking\Models\Booking;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CancelBookingRequest;
use App\Http\Requests\Customer\StorePabiliBookingRequest;
use App\Http\Requests\Customer\StorePasuyoBookingRequest;
use App\Http\Resources\BookingResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class BookingController extends Controller
{
    use AuthorizesRequests;

    private const int PER_PAGE = 20;

    public function index(Request $request): AnonymousResourceCollection
    {
        $bookings = Booking::query()
            ->with('rider')
            ->forCustomer($this->customer($request))
            ->latest('id')
            ->paginate(self::PER_PAGE);

        return BookingResource::collection($bookings);
    }

    public function show(Request $request, Booking $booking): BookingResource
    {
        $this->authorize('view', $booking);

        // rider.riderProfile: the resource shares the rider's position while the job is active.
        return BookingResource::make($booking->load(['rider.riderProfile', 'store', 'statusLogs']));
    }

    public function storePabili(StorePabiliBookingRequest $request, CreateBookingAction $createBooking): JsonResponse
    {
        $booking = $createBooking->handle($this->customer($request), $request->toData());

        return $this->created($booking);
    }

    public function storePasuyo(StorePasuyoBookingRequest $request, CreateBookingAction $createBooking): JsonResponse
    {
        $booking = $createBooking->handle($this->customer($request), $request->toData());

        return $this->created($booking);
    }

    public function cancel(CancelBookingRequest $request, Booking $booking, CancelBookingAction $cancelBooking): BookingResource
    {
        $this->authorize('cancel', $booking);

        $cancelled = $cancelBooking->handle($booking, $this->customer($request), $request->reason());

        return BookingResource::make($cancelled->load(['rider', 'store', 'statusLogs']));
    }

    private function created(Booking $booking): JsonResponse
    {
        return BookingResource::make($booking->load(['store', 'statusLogs']))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    private function customer(Request $request): User
    {
        /** @var User $user role:customer middleware guarantees a customer here */
        $user = $request->user();

        return $user;
    }
}
