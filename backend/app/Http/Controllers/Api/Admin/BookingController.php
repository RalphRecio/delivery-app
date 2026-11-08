<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Actions\CancelBookingAsSupportAction;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Models\Booking;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListBookingsRequest;
use App\Http\Requests\Admin\SupportCancelBookingRequest;
use App\Http\Resources\BookingResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class BookingController extends Controller
{
    use AuthorizesRequests;

    public function index(ListBookingsRequest $request): AnonymousResourceCollection
    {
        $bookings = Booking::query()
            ->with(['customer', 'rider'])
            ->when($request->status(), fn ($query, BookingStatus $status) => $query->where('status', $status))
            ->when($request->serviceType(), fn ($query, ServiceType $type) => $query->where('service_type', $type))
            ->when($request->search(), fn ($query, string $term) => $query->where('reference', 'ilike', '%'.$term.'%'))
            ->latest('id')
            ->paginate($request->perPage());

        return BookingResource::collection($bookings);
    }

    public function show(Booking $booking): BookingResource
    {
        $this->authorize('manage', $booking);

        return BookingResource::make($booking->load(['customer', 'rider', 'statusLogs']));
    }

    public function cancel(SupportCancelBookingRequest $request, Booking $booking, CancelBookingAsSupportAction $cancelBooking): BookingResource
    {
        $this->authorize('manage', $booking);

        /** @var User $admin */
        $admin = $request->user();

        $cancelled = $cancelBooking->handle($admin, $booking, $request->reason());

        return BookingResource::make($cancelled->load(['customer', 'rider', 'statusLogs']));
    }
}
