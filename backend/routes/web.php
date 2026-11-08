<?php

declare(strict_types=1);

use App\Http\Responses\ApiResponse;
use Illuminate\Support\Facades\Route;

// The backend is API-only. The root just identifies the service.
Route::get('/', fn () => ApiResponse::success(['app' => config('app.name'), 'api' => url('/api/v1')]));
