# ADR 0008: Rider matching by polling, widening radius, first-accept-wins

Date: 2026-11-02 · Status: accepted

## Decision

- A new booking moves to `searching` immediately (listener on `BookingCreated`, synchronous after commit) with a search radius of 3 km around the pickup.
- Riders are not pushed offers. The rider app, while online and with a fresh location, polls `GET /rider/jobs/available` every 10 seconds. The server returns `searching` bookings whose own radius reaches the rider's last reported position, nearest first.
- `bookings:widen-search` runs every minute and widens the radius of any booking that has waited longer than the offer timeout (60 s) by 2 km, up to 10 km. Past that the booking keeps waiting; admins cancel it in a later phase.
- Accepting locks the booking row (`lockForUpdate`), re-checks it is still `searching` and unassigned, sets the rider and transitions to `accepted`. A second rider gets a 409. A rider must be online and may hold one active job at a time.
- Riders progress a job through `picking_up`, `in_transit`, `completed` via one endpoint that only accepts those three statuses. Cancelling stays a customer or support action.
- Customers see the assigned rider's name and phone; riders see the customer's. Both apps poll while a booking is in progress.

## Why

- Polling needs no WebSocket server, no push credentials and no background-task permissions, so riders can be tested today on web and in Expo Go. The interval is short enough for a dispatch feel in a small fleet; a realtime channel can replace the poll later without changing the matching rules.
- A per-booking radius stored on the row lets a single spatial query (`ST_DWithin` against `search_radius_meters`) answer "what may this rider see" for every booking at once.
- Widening on a schedule, rather than per-booking timers, is one command with one query and nothing to lose on a restart.
- The row lock is the only reliable guard against two riders accepting at the same instant; everything else (online flag, one-job rule) is a convenience check before the lock.

## Consequences

- `php artisan schedule:work` (or the cron entry) must run for radii to widen. Without it, bookings still match within 3 km.
- Offers are visible to every eligible rider at once; there is no exclusive offer window. That is intentional for a small fleet and can change with push-based dispatch.
- Rider location is typed, taken from the browser, or set to a sample point until the native location module is added.
