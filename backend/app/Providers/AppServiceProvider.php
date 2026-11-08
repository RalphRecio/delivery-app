<?php

declare(strict_types=1);

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Authenticated;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    private const int API_REQUESTS_PER_MINUTE = 60;

    private const int REGISTRATIONS_PER_MINUTE = 5;

    private const int LOGIN_ATTEMPTS_PER_MINUTE = 10;

    private const int BOOKING_REQUESTS_PER_MINUTE = 10;

    private const int TOPUP_REQUESTS_PER_MINUTE = 5;

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureModels();
        $this->configureDates();
        $this->configureDatabase();
        $this->configureLogContext();
        $this->configureRateLimiting();
    }

    /**
     * Outside production, make Eloquent fail loudly on lazy loading (N+1),
     * on filling unfillable attributes, and on reading attributes that were
     * not loaded. In production these would only be noise in the logs.
     */
    private function configureModels(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
    }

    private function configureDates(): void
    {
        Date::use(CarbonImmutable::class);
    }

    /** Blocks migrate:fresh, db:wipe and similar commands against production data. */
    private function configureDatabase(): void
    {
        DB::prohibitDestructiveCommands($this->app->isProduction());
    }

    /** Every log line written after authentication carries the user id. */
    private function configureLogContext(): void
    {
        Event::listen(Authenticated::class, function (Authenticated $event): void {
            Context::add('user_id', $event->user->getAuthIdentifier());
        });
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(self::API_REQUESTS_PER_MINUTE)
            ->by($request->user()?->getAuthIdentifier() ?? $request->ip()));

        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(self::REGISTRATIONS_PER_MINUTE)
            ->by('register:'.$request->ip()));

        // Keyed by email and IP together: one account cannot be hammered from
        // many addresses, and one address cannot try many accounts.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(self::LOGIN_ATTEMPTS_PER_MINUTE)
            ->by('login:'.mb_strtolower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('topups', fn (Request $request) => Limit::perMinute(self::TOPUP_REQUESTS_PER_MINUTE)
            ->by('topups:'.($request->user()?->getAuthIdentifier() ?? $request->ip())));

        RateLimiter::for('bookings', fn (Request $request) => Limit::perMinute(self::BOOKING_REQUESTS_PER_MINUTE)
            ->by('bookings:'.($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
