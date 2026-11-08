# Backend

Laravel 13 API for the delivery app. PHP 8.4, PostgreSQL 17 + PostGIS, Redis, Sanctum tokens.

## Setup

```sh
docker compose up -d postgres redis   # from the repo root: PostgreSQL on 5440, Redis on 6390
# or run the API itself in Docker too: `docker compose up -d` (see the root README)
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed      # one admin, rider and customer account (see docs/auth-flow.md)
php artisan serve               # http://localhost:8000
php artisan schedule:work       # in another terminal: widens rider search radii every minute
curl http://localhost:8000/api/v1/health
```

## Sign-in codes (OTP)

| Variable         | Local default | Meaning                                                     |
|------------------|---------------|-------------------------------------------------------------|
| `OTP_SENDER`     | `log`         | `log` writes codes to `storage/logs/laravel.log`; `semaphore` sends SMS |
| `OTP_FIXED_CODE` | `123456`      | Every code equals this value. Ignored in production. Empty = random |
| `SEMAPHORE_API_KEY`, `SEMAPHORE_SENDER_NAME` | | Needed when `OTP_SENDER=semaphore` |

Limits (length, lifetime, attempts, cooldown) live in `config/otp.php`.

## Scripts

| Command                 | What it does                                  |
|-------------------------|-----------------------------------------------|
| `composer run lint`     | Pint in check mode                            |
| `composer run lint:fix` | Pint, writes fixes                            |
| `composer run analyse`  | Larastan (PHPStan level 6) on app, database, routes |
| `composer run test`     | Pest (needs the PostGIS container running)    |
| `composer run check`    | all three, in CI order                        |

## Layout

See the root `CLAUDE.md` for the full conventions and `docs/architecture.md` for the request flow.

```
app/Domain/<Domain>/      Actions, Data, Enums, Events, Exceptions, Jobs, Listeners, Models, Policies, Services
app/Domain/Auth/          User, OtpCode, UserRole, Request/Verify OTP actions, OtpSender contract
app/Domain/Booking/       Booking, FareSetting, BookingStatus state machine, FareCalculator, quote/create/cancel actions
app/Domain/Rider/         RiderProfile, RiderMatcher, accept/progress/search actions, matching settings
app/Domain/Store/         Store, StoreProduct, StoreFinder (catalogue for Pabili orders)
app/Domain/Admin/         DashboardSummary (admin actions live in the domain they touch: Auth, Booking)
app/Domain/Shared/        Money, GeoPoint, PhoneNumber, DomainException
app/Http/                 Controllers/Api/<Audience>, Requests, Resources, Middleware, Responses
app/Infrastructure/       Maps, Sms clients
routes/api/<audience>.php auth, customer, rider, admin (all under /api/v1)
tests/Feature, tests/Unit
```

## Conventions worth knowing

- Every response uses the envelope `{ success, message, data, errors }`. Return an `ApiResource` or `ApiResponse::success()`; throw a `DomainException` subclass for business failures.
- Eloquent runs in strict mode outside production: lazy loading throws, so eager load.
- Dates are `CarbonImmutable`. Money is `Money` (integer centavos). Coordinates are `GeoPoint`.
- Rate limiters `api`, `otp`, `otp-verify` and `bookings` are defined in `AppServiceProvider`; apply with `throttle:otp`.
- Audience route groups (`customer`, `rider`, `admin`) require `auth:sanctum` and the matching `role:` middleware.
- Contracts at real boundaries (`OtpSender`, `DistanceProvider`) are bound in `DomainServiceProvider`; tests replace them with fakes (`tests/Support`).
- Policies for Domain models are registered in `DomainServiceProvider::boot()` (Laravel cannot guess them outside `app/Models`).
- `php artisan db:seed` also seeds the launch tariff (`FareSettingSeeder`). Tariffs are cached for an hour; call `FareSettingsRepository::forget()` after editing one.
- Domain event listeners are registered explicitly in `DomainServiceProvider::boot()`; matching limits live in `config/matching.php`.

## Push notifications

Web push to the PWA (ADR 0020 addendum). `VAPID_*` in `.env` are generated once with
`php artisan webpush:vapid --show`. Any feature sends one with
`$user->notify(new PushMessageNotification($title, $body, $url))`; a quick end-to-end test is
`php artisan push:test customer@example.com --title="Hello" --body="From the server"`, which
reports how many of the user's browsers it went to.
