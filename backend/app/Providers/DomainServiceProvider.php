<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Booking\Contracts\DistanceProvider;
use App\Domain\Booking\Events\BookingCreated;
use App\Domain\Booking\Listeners\StartRiderSearchOnBookingCreated;
use App\Domain\Booking\Models\Booking;
use App\Domain\Booking\Policies\BookingPolicy;
use App\Domain\Payment\Contracts\PaymentGateway;
use App\Domain\Payment\Gateways\PayMongoGateway;
use App\Domain\Rider\Data\MatchingSettings;
use App\Domain\Wallet\Data\WalletSettings;
use App\Infrastructure\Maps\StraightLineDistanceProvider;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Client\Factory as HttpClient;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

/**
 * Wires domain contracts to their infrastructure implementations.
 * Each boundary (distance and payments now; maps later) is chosen here so it
 * can be swapped per environment and replaced by a fake in tests.
 */
final class DomainServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(DistanceProvider::class, StraightLineDistanceProvider::class);

        $this->app->singleton(MatchingSettings::class, fn (Application $app) => MatchingSettings::fromConfig($app->make(Repository::class)));
        $this->app->singleton(WalletSettings::class, fn (Application $app) => WalletSettings::fromConfig($app->make(Repository::class)));

        $this->app->bind(PaymentGateway::class, function (Application $app): PaymentGateway {
            $config = $app->make(Repository::class);
            $driver = $config->get('wallet.gateway');

            return match ($driver) {
                'paymongo' => new PayMongoGateway(
                    http: $app->make(HttpClient::class),
                    secretKey: (string) $config->get('services.paymongo.secret_key'),
                    webhookSecret: (string) $config->get('services.paymongo.webhook_secret'),
                    baseUrl: (string) $config->get('services.paymongo.base_url'),
                    isLiveMode: (bool) $config->get('services.paymongo.live_mode'),
                ),
                default => throw new InvalidArgumentException("Unknown payment gateway '{$driver}'."),
            };
        });
    }

    /** Models live under Domain, so Laravel cannot guess policy names; they are listed here. */
    public function boot(): void
    {
        Gate::policy(Booking::class, BookingPolicy::class);

        // Domain listeners are registered explicitly rather than discovered,
        // so the wiring is readable in one place.
        Event::listen(BookingCreated::class, StartRiderSearchOnBookingCreated::class);
    }
}
