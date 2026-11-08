<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Rider matching
    |--------------------------------------------------------------------------
    |
    | A booking is offered to online riders whose last reported location is
    | within its search radius of the pickup. The radius starts small and
    | widens every offer_timeout_seconds until max_radius_meters.
    |
    */

    'initial_radius_meters' => 3000,

    'radius_step_meters' => 2000,

    'max_radius_meters' => 10000,

    'offer_timeout_seconds' => 60,

    // A rider whose location is older than this is not offered jobs.
    'location_stale_seconds' => 300,

    // The rider app sends a heartbeat every 60 s while open and online. A
    // rider not heard from for this long is not counted as on duty
    // (closed the app, lost signal); two missed beats of slack.
    'presence_timeout_seconds' => 150,

];
