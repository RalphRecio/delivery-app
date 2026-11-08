# Architecture

## Backend request flow

```
HTTP request
  │
  ▼
routes/api/{auth,customer,rider,admin}.php     one file per audience, all under /api/v1
  │
  ▼
Http/Controllers/Api/<Audience>/XController    thin: no business logic
  │
  ├─► Http/Requests/XRequest::toData()         validation, returns a typed DTO
  │
  ▼
Domain/<Domain>/Actions/XAction::handle()      ONE use case per class
  │
  ├─► Domain/<Domain>/Services/*               pure business rules (FareCalculator, RiderMatcher)
  ├─► Domain/<Domain>/Models/*                 Eloquent models
  └─► Domain/<Domain>/Events/*                 dispatched afterCommit
  │
  ▼
Http/Resources/XResource                       JSON shape, wrapped in the API envelope
```

### API envelope

Every JSON response, success or failure, has the same four keys:

```json
{ "success": true,  "message": null,        "data": { ... }, "errors": {} }
{ "success": false, "message": "Why",       "data": null,    "errors": { "field": ["..."] } }
```

- Success responses come from `ApiResource` / `ApiResourceCollection` (adds the keys around `data`) or `ApiResponse::success()`.
- Failures are produced in one place, `Http/Responses/ApiExceptionRenderer`, which maps:
  - `Domain\Shared\Exceptions\DomainException` → the status the exception declares (default 422)
  - `ValidationException` → 422 with field errors
  - `AuthenticationException` → 401
  - any HTTP exception (404, 403, 405, 429, ...) → its own status
  - anything else → 500 with a generic message (details are only shown when `APP_DEBUG=true`)

### Cross-cutting infrastructure

| Concern            | Where                                              |
|--------------------|----------------------------------------------------|
| Request id         | `Http/Middleware/AddRequestContext` (header `X-Request-Id`, also in every log line) |
| User id in logs    | `Authenticated` event listener in `AppServiceProvider` adds `user_id` to `Context` |
| Rate limits        | `AppServiceProvider::configureRateLimiting()` defines `api`, `register`, `login`, `bookings` |
| Role guard         | `Http/Middleware/EnsureUserHasRole` (`role:rider`), applied per audience group in `routes/api.php` |
| Domain bindings    | `Providers/DomainServiceProvider` wires contracts (e.g. `DistanceProvider`) to infrastructure |
| Strict Eloquent    | `Model::shouldBeStrict()` outside production (no lazy loading, no silent attribute mistakes) |
| Immutable dates    | `Date::use(CarbonImmutable::class)` |
| Money              | `Domain/Shared/ValueObjects/Money` (integer centavos) |
| Coordinates        | `Domain/Shared/ValueObjects/GeoPoint` (WGS 84, PostGIS `geography(Point, 4326)`) |
| Phone numbers      | `Domain/Shared/ValueObjects/PhoneNumber` (PH mobiles, E.164) |
| Geography columns  | `Domain/Shared/Casts/GeoPointCast` (EWKB in, EWKT out; no raw SQL in the domain) |
| Booking status     | `Domain/Booking/Enums/BookingStatus` holds the transitions; only `TransitionBookingStatusAction` changes a status |
| Idempotency        | `Idempotency-Key` header on booking creation, unique per customer |
| Scheduled work     | `routes/console.php` (`bookings:widen-search` every minute) |
| Domain events      | `DomainServiceProvider::boot()` lists listeners (`BookingCreated` → start rider search) |

## App layering

```
app/<audience>/screen.tsx          Expo Router screen: layout + wiring only (/customer, /rider, /admin; (auth) stays a group)
  │
  ▼
src/features/<feature>/hooks       TanStack Query hooks, feature logic
  │
  ▼
src/features/<feature>/api         typed functions: apiRequest(config, zodSchema)
  │
  ▼
src/shared/lib/api/client.ts       Axios instance, bearer token, error normalisation
```

- Features expose their public surface through `index.ts`. ESLint blocks deep imports (`@/features/x/internal`).
- `src/stores` holds only client state (session, rider online flag). Server data lives in the query cache.
- `src/config/env.ts` validates `EXPO_PUBLIC_*` variables with Zod at startup, so a missing variable fails fast.
- Role areas are real URL segments (`/customer`, `/rider`, `/admin`), not route groups: three `(group)/index.tsx` files would all resolve to `/`, and a guard redirecting to `/` from inside a group loops forever.
- The customer area is responsive too: `CustomerShell` (top bar + centred column) at ≥1024 px, stacked screens below; `BookingForm` and `BookingDetails` take a `layout` prop (`stacked` | `split`). See ADR 0011.
- The admin area is responsive: `app/admin/_layout.tsx` wraps screens in `AdminShell` (sidebar + header + data tables) at ≥1024 px and in a plain stack below. Screens read `useBreakpoint()` and render either a table or the phone cards.
- Platform-specific UI uses file pairs (`MapPicker.tsx` for native, `MapPicker.web.tsx` for web); TypeScript checks the native file, Metro picks the right one.
- Every API response is parsed through `apiEnvelopeSchema(dataSchema)`; a contract mismatch surfaces as an `ApiError` of kind `contract` instead of a runtime crash deeper in the UI.
