<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Rider wallet (ADR 0016)
    |--------------------------------------------------------------------------
    |
    | Amounts are integer centavos. Riders below the minimum balance cannot
    | accept new bookings until they top up.
    |
    */

    // Off for now (ADR 0021): riders take jobs without a balance and no
    // commission is charged. Turn on to restore the minimum and commission.
    'enabled' => (bool) env('WALLET_ENABLED', false),

    'minimum_balance_centavos' => 15_000,   // ₱150

    'topup_min_centavos' => 10_000,         // ₱100

    'topup_max_centavos' => 500_000,        // ₱5,000

    // An unpaid top-up becomes "expired" after this; a payment that still
    // arrives later is credited anyway, because the rider's money was taken.
    'topup_expiry_minutes' => 60,

    // Which PaymentGateway implementation handles top-ups.
    'gateway' => env('WALLET_GATEWAY', 'paymongo'),

];
