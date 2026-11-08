<?php

declare(strict_types=1);

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\Webhooks\PayMongoWebhookController;
use Illuminate\Support\Facades\Route;

/*
 * All routes live under /api/v1 and are split by audience. Each audience file
 * only lists its own routes; the prefix, name and auth middleware are set here.
 */
Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', HealthController::class)->name('health');

    // Payment gateways call these; they authenticate by signature, not by token.
    Route::prefix('webhooks')
        ->name('webhooks.')
        ->group(function (): void {
            Route::post('paymongo', PayMongoWebhookController::class)->name('paymongo');
        });

    Route::prefix('auth')
        ->name('auth.')
        ->group(base_path('routes/api/auth.php'));

    Route::prefix('customer')
        ->name('customer.')
        ->middleware(['auth:sanctum', 'role:customer'])
        ->group(base_path('routes/api/customer.php'));

    Route::prefix('rider')
        ->name('rider.')
        ->middleware(['auth:sanctum', 'role:rider'])
        ->group(base_path('routes/api/rider.php'));

    Route::prefix('admin')
        ->name('admin.')
        ->middleware(['auth:sanctum', 'role:admin'])
        ->group(base_path('routes/api/admin.php'));
});
