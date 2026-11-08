<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Admin\BookingController;
use App\Http\Controllers\Api\Admin\BookingDispatchController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\FareSettingController;
use App\Http\Controllers\Api\Admin\StoreController;
use App\Http\Controllers\Api\Admin\StoreProductController;
use App\Http\Controllers\Api\Admin\UserController;
use Illuminate\Support\Facades\Route;

/*
 * admin routes. Prefix "/api/v1/admin", name prefix "api.v1.admin."
 * and middleware (auth:sanctum, role:admin) are applied in routes/api.php.
 */

Route::get('dashboard', DashboardController::class)->name('dashboard');

Route::get('fare-settings', [FareSettingController::class, 'index'])->name('fare-settings.index');
Route::put('fare-settings/{serviceType}', [FareSettingController::class, 'update'])->name('fare-settings.update');

Route::get('users', [UserController::class, 'index'])->name('users.index');
Route::get('riders', [UserController::class, 'riders'])->name('riders.index');
Route::post('riders', [UserController::class, 'storeRider'])->name('riders.store');
Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])->name('users.deactivate');
Route::post('users/{user}/reactivate', [UserController::class, 'reactivate'])->name('users.reactivate');

Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
Route::get('bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
Route::post('bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
Route::get('bookings/{booking}/rider-candidates', [BookingDispatchController::class, 'candidates'])->name('bookings.rider-candidates');
Route::post('bookings/{booking}/assign-rider', [BookingDispatchController::class, 'assign'])->name('bookings.assign-rider');

Route::get('stores', [StoreController::class, 'index'])->name('stores.index');
Route::post('stores', [StoreController::class, 'store'])->name('stores.store');
Route::get('stores/{store}', [StoreController::class, 'show'])->name('stores.show');
Route::put('stores/{store}', [StoreController::class, 'update'])->name('stores.update');
Route::post('stores/{store}/products', [StoreProductController::class, 'store'])->name('stores.products.store');
Route::put('stores/{store}/products/{product}', [StoreProductController::class, 'update'])
    ->scopeBindings()
    ->name('stores.products.update');
