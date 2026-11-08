<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Rider;

use App\Domain\Auth\Models\User;
use App\Domain\Rider\Actions\RecordRiderHeartbeatAction;
use App\Domain\Rider\Actions\SetRiderAvailabilityAction;
use App\Domain\Rider\Actions\UpdateRiderLocationAction;
use App\Domain\Rider\Models\RiderProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rider\UpdateAvailabilityRequest;
use App\Http\Requests\Rider\UpdateLocationRequest;
use App\Http\Resources\RiderProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RiderProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->ok(RiderProfile::forRider($this->rider($request)));
    }

    public function updateAvailability(UpdateAvailabilityRequest $request, SetRiderAvailabilityAction $setAvailability): JsonResponse
    {
        return $this->ok($setAvailability->handle($this->rider($request), $request->isOnline()));
    }

    public function updateLocation(UpdateLocationRequest $request, UpdateRiderLocationAction $updateLocation): JsonResponse
    {
        return $this->ok($updateLocation->handle($this->rider($request), $request->location()));
    }

    /** "Still here": sent every minute by the rider app while it is open and online. */
    public function heartbeat(Request $request, RecordRiderHeartbeatAction $recordHeartbeat): JsonResponse
    {
        return $this->ok($recordHeartbeat->handle($this->rider($request)));
    }

    /**
     * The profile is created lazily on first use, and a resource for a
     * just-created model answers 201 by default; these are reads and
     * updates, so always answer 200.
     */
    private function ok(RiderProfile $profile): JsonResponse
    {
        return RiderProfileResource::make($profile)->response()->setStatusCode(Response::HTTP_OK);
    }

    private function rider(Request $request): User
    {
        /** @var User $user role:rider middleware guarantees a rider here */
        $user = $request->user();

        return $user;
    }
}
