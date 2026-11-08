<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Actions\UpdateFareSettingAction;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Booking\Models\FareSetting;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateFareSettingRequest;
use App\Http\Resources\FareSettingResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class FareSettingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FareSettingResource::collection(FareSetting::query()->orderBy('service_type')->get());
    }

    public function update(UpdateFareSettingRequest $request, ServiceType $serviceType, UpdateFareSettingAction $updateFareSetting): JsonResponse
    {
        /** @var User $admin */
        $admin = $request->user();

        $setting = $updateFareSetting->handle($admin, $serviceType, $request->toData());

        // updateOrCreate may have just created the row; this is still an update to the caller.
        return FareSettingResource::make($setting)->response()->setStatusCode(Response::HTTP_OK);
    }
}
