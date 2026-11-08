<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Auth\Actions\CreateRiderAccountAction;
use App\Domain\Auth\Actions\SetUserActivationAction;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Models\Booking;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateRiderRequest;
use App\Http\Requests\Admin\ListUsersRequest;
use App\Http\Resources\RiderResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class UserController extends Controller
{
    public function index(ListUsersRequest $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->when($request->role(), fn ($query, UserRole $role) => $query->where('role', $role))
            ->when($request->search(), fn ($query, string $term) => $query->search($term))
            ->latest('id')
            ->paginate($request->perPage());

        return UserResource::collection($users);
    }

    /** Riders with their availability and, if any, the job they are on. */
    public function riders(ListUsersRequest $request): AnonymousResourceCollection
    {
        $activeStatuses = array_map(
            static fn (BookingStatus $status) => $status->value,
            [BookingStatus::Accepted, BookingStatus::PickingUp, BookingStatus::InTransit],
        );

        $riders = User::query()
            ->where('role', UserRole::Rider)
            ->when($request->search(), fn ($query, string $term) => $query->search($term))
            ->with('riderProfile')
            ->addSelect([
                'users.*',
                'active_job_reference' => Booking::query()
                    ->select('reference')
                    ->whereColumn('rider_id', 'users.id')
                    ->whereIn('status', $activeStatuses)
                    ->limit(1),
            ])
            ->orderByDesc('id')
            ->paginate($request->perPage());

        return RiderResource::collection($riders);
    }

    public function storeRider(CreateRiderRequest $request, CreateRiderAccountAction $createRider): JsonResponse
    {
        $rider = $createRider->handle($this->admin($request), $request->toData());

        return UserResource::make($rider)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function deactivate(Request $request, User $user, SetUserActivationAction $setActivation): UserResource
    {
        return UserResource::make($setActivation->handle($this->admin($request), $user, false));
    }

    public function reactivate(Request $request, User $user, SetUserActivationAction $setActivation): UserResource
    {
        return UserResource::make($setActivation->handle($this->admin($request), $user, true));
    }

    private function admin(Request $request): User
    {
        /** @var User $user role:admin middleware guarantees an admin here */
        $user = $request->user();

        return $user;
    }
}
