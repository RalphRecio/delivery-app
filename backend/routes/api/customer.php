<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Customer\BookingController;
use App\Http\Controllers\Api\Customer\FareQuoteController;
use App\Http\Controllers\Api\Customer\RidersOnDutyController;
use App\Http\Controllers\Api\Customer\StoreController;
use Illuminate\Support\Facades\Route;

/*
 * customer routes. Prefix "/api/v1/customer", name prefix "api.v1.customer."
 * and middleware (auth:sanctum, role:customer) are applied in routes/api.php.
 */

Route::get('stores', [StoreController::class, 'index'])->name('stores.index');
Route::get('stores/{store}', [StoreController::class, 'show'])->name('stores.show');

Route::get('riders/on-duty', RidersOnDutyController::class)->name('riders.on-duty');

Route::post('bookings/quote', FareQuoteController::class)->name('bookings.quote');

Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
Route::get('bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');

Route::middleware('throttle:bookings')->group(function (): void {
    Route::post('bookings/pabili', [BookingController::class, 'storePabili'])->name('bookings.store-pabili');
    Route::post('bookings/pasuyo', [BookingController::class, 'storePasuyo'])->name('bookings.store-pasuyo');
});

Route::post('bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
