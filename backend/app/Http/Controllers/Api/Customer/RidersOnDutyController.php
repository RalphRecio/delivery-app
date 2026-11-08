<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Customer;

use App\Domain\Rider\Services\RiderAvailability;
use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

/** The home screen's "N riders on duty" line. */
final class RidersOnDutyController extends Controller
{
    public function __invoke(RiderAvailability $availability): JsonResponse
    {
        return ApiResponse::success([
            'service_area' => (string) config('app.service_area'),
            'riders_on_duty' => $availability->onDutyCount(),
        ]);
    }
}
