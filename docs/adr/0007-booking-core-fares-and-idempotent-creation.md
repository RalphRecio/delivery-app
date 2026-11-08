# ADR 0007: Booking core: server-side fares, straight-line distance, idempotent creation

Date: 2026-11-02 · Status: accepted

## Decision

- A booking's fare is always computed on the server by `Domain\Booking\Actions\QuoteFareAction` from the tariff in `fare_settings` and the trip distance. The same action serves the quote endpoint and booking creation, so the price the customer saw is the price stored. Anything price-like in the request body is ignored.
- The tariff is `base fare (covers an included distance) + per-km rate pro rata per metre beyond it + flat service fee`, floored at a minimum fare. Pabili carries a service fee for queuing and paying at the store; Pasuyo does not.
- Distance comes from the `DistanceProvider` contract. The first implementation is a great-circle estimate scaled by a 1.3 road factor (`Infrastructure\Maps\StraightLineDistanceProvider`). A routing provider replaces it behind the same interface.
- Creation accepts an `Idempotency-Key` header. The same key from the same customer returns the already-created booking instead of a duplicate.
- New bookings start in `pending`. Nothing moves them to `searching` yet; the matching phase will listen to `BookingCreated` and do that.
- Customers may cancel in `pending`, `searching` and `accepted`. From `picking_up` on, cancellation is a support action in a later phase.

## Why

- Trusting a client-sent fare is the easiest way to lose money. Recalculating costs one query against a cached tariff.
- Pro-rata distance avoids the "2.1 km billed as 3 km" complaint without adding any arithmetic beyond integer centavos.
- A straight-line estimate ships now and keeps the maps provider (an external cost and failure point) out of this phase. The road factor makes early quotes realistic enough to test with.
- Mobile networks drop responses after the server has committed. Without an idempotency key, a retry would charge a second rider trip.
- `pending` is honest: there is no matching yet, so claiming to be "searching" would mislead the customer.

## Consequences

- `fare_settings` is cached for an hour as plain arrays (not serialised objects, which break on class changes). Whoever edits a tariff must call `FareSettingsRepository::forget()`.
- Geography columns go through `Domain\Shared\Casts\GeoPointCast`, which decodes PostGIS EWKB on read and writes EWKT as a bound parameter, so no raw SQL appears in the domain.
- The app types coordinates by hand (with sample locations for testing) until the map picker arrives.
