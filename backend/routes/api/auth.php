<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\PushSubscriptionController;
use App\Http\Controllers\Api\Auth\RegistrationController;
use App\Http\Controllers\Api\Auth\SessionController;
use Illuminate\Support\Facades\Route;

/*
 * auth routes. Prefix "/api/v1/auth", name prefix "api.v1.auth."
 * and middleware are applied in routes/api.php.
 */

Route::post('register', RegistrationController::class)
    ->middleware('throttle:register')
    ->name('register');

Route::post('login', LoginController::class)
    ->middleware('throttle:login')
    ->name('login');

// Public: the browser needs the key before it can subscribe.
Route::get('push/public-key', [PushSubscriptionController::class, 'publicKey'])->name('push.public-key');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('me', [SessionController::class, 'show'])->name('me');
    Route::post('logout', [SessionController::class, 'destroy'])->name('logout');
    Route::post('push-subscriptions', [PushSubscriptionController::class, 'store'])->name('push-subscriptions.store');
    Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy'])->name('push-subscriptions.destroy');
});
