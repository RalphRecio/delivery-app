<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Admin\Services\DashboardSummary;
use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

final class DashboardController extends Controller
{
    public function __invoke(DashboardSummary $summary): JsonResponse
    {
        return ApiResponse::success($summary->build());
    }
}
