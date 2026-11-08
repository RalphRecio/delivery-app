# Delivery App (Pabili / Pasuyo booking platform)

Monorepo with two deliverables that follow the folder conventions below exactly:

- `backend/` — Laravel 13 API (PHP 8.4, PostgreSQL 17 + PostGIS, Redis, Sanctum tokens)
- `app/` — Expo SDK 58 / React Native app (Expo Router, TanStack Query, Zustand, Zod)

This app is standalone. It does **not** connect to MSSQL, the Suhay UMS, or any other Suhay system.

## Everyday commands

```sh
docker compose up -d                      # whole stack: PostgreSQL (5440), Redis (6390), API (8000), queue, scheduler, Expo web (8082)
docker compose up -d postgres redis       # infrastructure only, then run the API and app on the host:
cd backend && composer run check          # pint --test, phpstan (level 6), pest
cd backend && php artisan serve           # API on http://localhost:8000
cd app && npm run check                   # eslint, tsc --noEmit, jest
cd app && npx expo start                  # app dev server
```

Dockerfiles and entrypoints live in `docker/php` and `docker/node`; `docker compose exec api php artisan ...` runs artisan in the container.

Pre-commit hooks (Husky + lint-staged) run Pint, ESLint and Prettier on staged files.
Commit messages must follow Conventional Commits (enforced by commitlint).

## Code Quality: Senior-Level Engineering, Readable Code (IMPORTANT)

Write code the way an experienced senior engineer would for a production system: well-architected, type-safe, tested, and secure. At the same time, it must be **easy to read and navigate**. Good senior code is simple and explicit, not clever. Readability and maintainability come before brevity.

### Principles
- **Domain-driven, modular structure:** organize code by business domain (Booking, Rider, Payment), not only by technical layer.
- **Single responsibility:** small, focused classes and functions with clear names.
- **Explicit over implicit:** typed inputs and outputs, no hidden side effects, no "magic".
- **Strict typing everywhere:** `declare(strict_types=1)` in PHP, `strict: true` in TypeScript, no `any`.
- **Pragmatic abstraction:** introduce interfaces only at real boundaries (payment gateway, maps provider, SMS provider) so they can be swapped or mocked. No abstraction for its own sake.
- **Consistency:** every feature follows the same patterns, so the codebase reads like one person wrote it.
- **Self-documenting code:** names explain the "what"; comments explain the "why" (business rules, edge cases, trade-offs).

---

### Backend architecture (Laravel, domain-based)

```
backend/
├── app/
│   ├── Domain/                         # Business logic, grouped by domain
│   │   ├── Booking/
│   │   │   ├── Actions/                # One use case per class, single handle() method
│   │   │   │   ├── CreateBookingAction.php
│   │   │   │   ├── AcceptBookingOfferAction.php
│   │   │   │   ├── TransitionBookingStatusAction.php
│   │   │   │   └── CancelBookingAction.php
│   │   │   ├── Data/                   # DTOs (typed, immutable input/output objects)
│   │   │   │   ├── CreatePabiliBookingData.php
│   │   │   │   ├── CreatePasuyoBookingData.php
│   │   │   │   └── FareBreakdownData.php
│   │   │   ├── Enums/
│   │   │   │   ├── BookingStatus.php   # Includes allowed transitions: canTransitionTo()
│   │   │   │   └── ServiceType.php
│   │   │   ├── Events/
│   │   │   ├── Exceptions/             # e.g. InvalidStatusTransitionException, BookingAlreadyAcceptedException
│   │   │   ├── Jobs/
│   │   │   ├── Listeners/
│   │   │   ├── Models/
│   │   │   ├── Policies/
│   │   │   └── Services/
│   │   │       ├── FareCalculator.php
│   │   │       └── RiderMatcher.php
│   │   ├── Rider/
│   │   ├── Customer/
│   │   ├── Payment/
│   │   │   ├── Contracts/PaymentGateway.php     # Interface at a real boundary
│   │   │   └── Gateways/PayMongoGateway.php
│   │   └── Shared/                     # Value objects used across domains
│   │       ├── ValueObjects/Money.php  # Money stored as integer centavos
│   │       └── ValueObjects/GeoPoint.php
│   ├── Http/                           # Delivery layer only (thin)
│   │   ├── Controllers/Api/{Customer,Rider,Admin,Auth}/
│   │   ├── Requests/                   # Validation + toData() method returning a DTO
│   │   ├── Resources/
│   │   └── Middleware/
│   ├── Infrastructure/                 # External integrations
│   │   ├── Maps/GoogleMapsClient.php
│   │   └── Sms/SemaphoreClient.php
│   └── Providers/
├── routes/api/{customer,rider,admin,auth}.php
├── database/
└── tests/
    ├── Feature/                        # API-level tests per domain
    └── Unit/                           # Services, value objects, enums
```

### Backend standards
- **Request flow:** Route → Controller → Form Request (validates, returns DTO) → Action → Services/Models → API Resource. Controllers contain no business logic.
- **DTOs** (spatie/laravel-data or plain readonly classes) pass data between layers. No raw arrays travelling through business logic.
- **State machine:** booking status changes happen in ONE action that checks `BookingStatus::canTransitionTo()` and throws a domain exception on invalid transitions. Every change is logged in `booking_status_logs`.
- **Concurrency:** use row-level locking (`lockForUpdate()`) inside transactions when a rider accepts a booking, so two riders can never accept the same job.
- **Idempotency:** payment webhooks and booking creation accept an idempotency key to prevent duplicates.
- **Money:** store and calculate as integer centavos via a `Money` value object. Never use floats for money.
- **Transactions:** wrap multi-step writes in `DB::transaction()`. Dispatch events/jobs `afterCommit`.
- **Errors:** throw specific domain exceptions; map them to consistent JSON in the exception handler: `{ success, message, data, errors }` with correct HTTP status codes.
- **Security:** Policies for every resource, rate limiting on auth and booking endpoints, never trust client-sent prices (always recalculate fares server-side).
- **Performance:** eager load relationships (prevent N+1 with `Model::preventLazyLoading()` in development), GIST indexes on geography columns, cache fare settings.
- **Logging:** structured logs with booking ID and user ID context for traceability.

Example of the expected style:

```php
final class BookingController extends Controller
{
    public function store(
        StorePasuyoBookingRequest $request,
        CreateBookingAction $createBooking,
    ): BookingResource {
        $booking = $createBooking->handle(
            customer: $request->user(),
            data: $request->toData(),
        );

        return BookingResource::make($booking);
    }
}

final class AcceptBookingOfferAction
{
    /**
     * Assigns a rider to a booking. Locks the row so only the first rider
     * to accept gets the job; others receive BookingAlreadyAcceptedException.
     */
    public function handle(Rider $rider, Booking $booking): Booking
    {
        return DB::transaction(function () use ($rider, $booking) {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($booking->rider_id !== null) {
                throw new BookingAlreadyAcceptedException($booking);
            }

            $booking->assignRider($rider);

            BookingAccepted::dispatch($booking);

            return $booking;
        });
    }
}
```

---

### Frontend architecture (Expo / React Native, feature-based)

```
app/
├── app/                                # Expo Router: screens only, thin
│   ├── (auth)/                         # customer login, register (group: URLs stay /login, /register);
│   │                                   # riders and admins sign in at /rider/login, /admin/login
│   ├── customer/                       # real URL segments per role (/customer, /rider, /admin),
│   ├── rider/                          # never groups: three "(group)/index" files would all map to "/"
│   ├── admin/                          # and the role-guard redirects would loop
│   └── _layout.tsx
├── src/
│   ├── features/
│   │   ├── booking/
│   │   │   ├── api/                    # Typed API functions
│   │   │   │   └── bookingApi.ts
│   │   │   ├── hooks/                  # TanStack Query hooks + feature logic
│   │   │   │   ├── useCreateBooking.ts
│   │   │   │   └── useBookingRealtime.ts
│   │   │   ├── components/
│   │   │   ├── schemas/                # Zod schemas (form + API response validation)
│   │   │   ├── types.ts
│   │   │   └── index.ts                # Public exports of the feature
│   │   ├── auth/
│   │   ├── rider/
│   │   ├── payment/
│   │   ├── chat/
│   │   └── map/
│   ├── shared/
│   │   ├── ui/                         # Design system: Button, Input, Card, Sheet, Skeleton
│   │   ├── lib/
│   │   │   ├── api/client.ts           # Axios instance, auth interceptor, error normalization
│   │   │   ├── realtime/echo.ts
│   │   │   └── format/                 # formatMoney(), formatDistance()
│   │   ├── hooks/
│   │   └── types/
│   ├── stores/                         # Zustand: only true client state (auth session, rider online status)
│   └── config/                         # env (validated with Zod), theme, query client
└── assets/
```

### Frontend standards
- **Layering:** Screen → feature hooks → api functions → API client. Screens never call the API directly.
- **Feature boundaries:** features import from other features only through their `index.ts`. Shared code lives in `shared/`.
- **State:** server state in TanStack Query (with query key factories); Zustand only for client state. No duplicated server data in stores.
- **Type safety:** API responses validated with Zod at the boundary, so the rest of the app can trust its types.
- **Components:** small and composable; separate presentational components from those that fetch data. Typed props, no prop drilling beyond two levels.
- **UX states:** every screen handles loading (skeletons), error (with retry), empty, and offline states.
- **Real-time:** subscriptions live in dedicated hooks that clean up on unmount and update the query cache directly.
- **Platform code:** use `.web.tsx` / `.native.tsx` files instead of scattered `Platform.OS` checks.
- **Performance:** memoize only where measured; use FlashList for long lists; throttle rider location updates.

---

### Naming conventions
| Item | Convention | Example |
|---|---|---|
| PHP classes | PascalCase, role-based suffix | `CreateBookingAction`, `FareBreakdownData`, `BookingResource` |
| PHP classes not meant for extension | `final` | `final class FareCalculator` |
| Exceptions | Describe the problem | `InvalidStatusTransitionException` |
| DB tables / columns | snake_case, plural tables | `bookings`, `pickup_location` |
| API routes | kebab-case, plural, versioned | `/api/v1/customer/bookings/{id}/cancel` |
| React components | PascalCase | `FareSummary.tsx` |
| Hooks | `use` + intent | `useAcceptBookingOffer` |
| Booleans | `is` / `has` / `can` | `canCancel`, `hasReceipt` |
| Constants | UPPER_SNAKE_CASE | `OFFER_TIMEOUT_SECONDS` |

---

### Tooling and quality gates (set up in Phase 1)
- **Backend:** Laravel Pint (formatting), Larastan/PHPStan at level 6+ (static analysis), Pest for tests
- **Frontend:** ESLint + Prettier, TypeScript strict mode, Jest + React Native Testing Library
- **Git:** conventional commits, pre-commit hooks (Husky + lint-staged)
- **CI pipeline:** lint → static analysis → tests on every push (Gitea Actions-compatible workflow)
- **Testing priorities:** booking state transitions, concurrent accept, fare calculation, payment webhooks, authorization

### Documentation
- `README.md` in `/backend` and `/app`: setup, scripts, architecture overview
- `docs/architecture.md`: request flow diagrams and folder conventions
- `docs/booking-flow.md`: statuses, transitions, and matching logic in plain language
- Short ADRs (Architecture Decision Records) in `docs/adr/` for major decisions

### When generating code
- Follow these conventions strictly in every phase.
- After each phase, summarize the files created and the reasoning behind any non-obvious design decision.
- If there's a trade-off, choose the simpler readable option unless there's a clear production reason not to, and state the reason.
