<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Rider\JobController;
use App\Http\Controllers\Api\Rider\RiderProfileController;
use App\Http\Controllers\Api\Rider\WalletController;
use Illuminate\Support\Facades\Route;

/*
 * rider routes. Prefix "/api/v1/rider", name prefix "api.v1.rider."
 * and middleware (auth:sanctum, role:rider) are applied in routes/api.php.
 */

Route::get('profile', [RiderProfileController::class, 'show'])->name('profile.show');
Route::put('availability', [RiderProfileController::class, 'updateAvailability'])->name('availability.update');
Route::put('location', [RiderProfileController::class, 'updateLocation'])->name('location.update');
Route::post('heartbeat', [RiderProfileController::class, 'heartbeat'])->name('heartbeat');

Route::get('jobs/available', [JobController::class, 'available'])->name('jobs.available');
Route::get('jobs/active', [JobController::class, 'active'])->name('jobs.active');
Route::get('jobs', [JobController::class, 'index'])->name('jobs.index');
Route::get('jobs/{booking}', [JobController::class, 'show'])->name('jobs.show');
Route::post('jobs/{booking}/accept', [JobController::class, 'accept'])->name('jobs.accept');
Route::post('jobs/{booking}/status', [JobController::class, 'progress'])->name('jobs.progress');

Route::get('wallet', [WalletController::class, 'show'])->name('wallet.show');
Route::get('wallet/transactions', [WalletController::class, 'transactions'])->name('wallet.transactions');
Route::post('wallet/topups', [WalletController::class, 'storeTopup'])
    ->middleware('throttle:topups')
    ->name('wallet.topups.store');
Route::get('wallet/topups/{topup}', [WalletController::class, 'showTopup'])->name('wallet.topups.show');
