# Booking flow

Plain-language description of how a booking moves through the system. The code that enforces
this lives in `Domain/Booking/Enums/BookingStatus` (allowed transitions) and
`Domain/Booking/Actions/TransitionBookingStatusAction` (the only place a status changes).

> Status: customer booking, rider matching and rider status updates are implemented. Still to
> come: routing distance for fares, online payment, realtime push. Admin tools are covered in
> [ADR 0010](adr/0010-admin-tools-and-account-deactivation.md). See
> [ADR 0007](adr/0007-booking-core-fares-and-idempotent-creation.md) and
> [ADR 0008](adr/0008-pull-based-rider-matching.md).

## Service types

Two service types drive the flow and the tariff; Pabili also carries a category so riders know what
kind of store to head for. Customers see four offerings (see [ADR 0014](adr/0014-service-offerings.md)):

| Service type | Category (`pabili_category`) | Offered as        | What the rider does                                              |
|--------------|------------------------------|-------------------|------------------------------------------------------------------|
| `pabili`     | `grocery`                    | Pabili            | Buys pharmacy, grocery and other items the customer lists.       |
| `pabili`     | `food`                       | Pabili Food       | Buys food takeout and delivers it.                               |
| `pabili`     | `pet_food`                   | Pabili Pet Food   | Buys cat and dog food and other pet supplies.                    |
| `pasuyo`     | —                            | Pasuyo            | May ipapakuha o ipapahatid: fetches something at A, brings it to B. |

Every booking in the API carries `service_label` ("Pabili · Food takeout", "Pasuyo") for lists and headers.

## Statuses

| Status        | Meaning                                                               |
|---------------|-----------------------------------------------------------------------|
| `pending`     | Created by the customer, fare computed, no rider yet.                 |
| `searching`   | Offered to nearby riders; waiting for the first to accept.            |
| `accepted`    | A rider accepted. From here the booking belongs to exactly one rider. |
| `picking_up`  | Rider is heading to the pickup / store.                               |
| `in_transit`  | Rider has the goods and is heading to the drop-off.                   |
| `completed`   | Delivered and confirmed. Payment is settled.                          |
| `cancelled`   | Ended before completion, by the customer, rider, or admin.            |

## Allowed transitions

```
pending ──► searching ──► accepted ──► picking_up ──► in_transit ──► completed
   │            │            │             │              │
   └────────────┴────────────┴─────────────┴──────────────┴──► cancelled
```

- Any status except `completed` and `cancelled` can move to `cancelled`. A customer may cancel
  only while `pending`, `searching` or `accepted` (`BookingStatus::isCancellableByCustomer()`);
  from `picking_up` on, cancellation is a support action with a fee (later phase).
- Every transition is written to `booking_status_logs` with the actor and a timestamp.
- An invalid transition throws `InvalidStatusTransitionException` (HTTP 409).

## Matching

1. A new booking becomes `searching` right away with a 3 km search radius around the pickup
   (`StartRiderSearchAction`, triggered by `BookingCreated`).
2. Riders who are online and have reported a location in the last 5 minutes poll
   `GET /rider/jobs/available`. It returns `searching` bookings whose radius reaches the rider,
   nearest first (`RiderMatcher`).
3. The first rider to accept wins. `AcceptBookingOfferAction` locks the booking row, so a second
   rider receives `BookingAlreadyAcceptedException` (HTTP 409). A rider must be online and can
   hold one active job at a time.
4. Every minute `bookings:widen-search` adds 2 km to the radius of any booking nobody accepted in
   the last 60 s, up to 10 km (`config/matching.php`). Run `php artisan schedule:work` locally.
5. The assigned rider moves the job through `picking_up`, `in_transit`, `completed`.

### Dispatch (admin assigns a rider)

The admin is also the dispatcher (ADR 0017). On a `searching` booking's admin page, "Assign a
rider" lists every rider with an active account, each badged **On duty** (online, heartbeat in the
last 150 s) or **Offline**. Available riders come first, then on duty before offline, then nearest
to the pickup. Offline riders can be assigned too, typically after the dispatcher phones them.
Riders on another job or below the wallet minimum are listed but marked unavailable with the reason.
Assigning moves the booking straight to `accepted`; the rider does not confirm. The status log
records the admin as actor with the reason "Assigned by dispatcher". The rider app re-checks for an
active job every 10 s while online, so the job appears on its own; an offline rider sees it the next
time they open the app.

Riders can still accept open jobs themselves. Both paths go through `RiderAssigner`, which locks
the rider profile and then the booking, so whoever is first wins and one rider never gets two jobs.

## Fare

Fares are always recalculated on the server from distance, service type and the current fare
settings. A price sent by the client is never trusted. All amounts are integer centavos
(`Money` value object).

```
chargeable metres = max(0, distance − included distance)
distance fare     = per-km rate × chargeable metres / 1000   (rounded half-up to the centavo)
total             = max(base fare + distance fare + service fee, minimum fare)
```

| Service | Base fare | Included | Per extra km | Service fee | Minimum |
|---------|-----------|----------|--------------|-------------|---------|
| Pasuyo | ₱49       | 2 km     | ₱10          | ₱0          | ₱49     |
| Pabili  | ₱59       | 2 km     | ₱10          | ₱20         | ₱79     |

Launch tariff from `database/seeders/FareSettingSeeder.php`; admins will edit it in a later phase.
Distance is a straight-line estimate × 1.3 until the routing provider is connected.

## Pabili as a typed list (current)

The customer fills a shopping-list table (item, quantity, note), sets a purchase budget, pins the
drop-off and may open "Other details" to leave notes for the rider. There is no pickup: the rider
chooses a store near the drop-off, the booking records that as its pickup at the drop-off point, and
the fare is base fare + service fee (zero distance). The store catalogue below is paused behind
`features.storeCatalogue` in the app; see [ADR 0013](adr/0013-pause-store-catalogue.md).

## Pabili from a store (paused)

With the catalogue on, the customer picks a store, adds products, and continues to booking. The store
is the pickup; the server snapshots product names and prices (`items[].product_id`,
`items[].unit_price_centavos`) and an `items_subtotal`. Products not on the menu and budgets below the
subtotal are rejected. See [ADR 0012](adr/0012-store-catalogue-for-pabili.md).

## Customer API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/customer/stores?latitude=&longitude=&search=` | Active stores, nearest first with `distance_meters` when a point is given |
| GET | `/api/v1/customer/stores/{id}` | A store with its available products |
| POST | `/api/v1/customer/bookings/quote` | Fare for a service type and two points; Pabili may omit `pickup` (zero distance) |
| POST | `/api/v1/customer/bookings/pabili` | Create a Pabili booking (`pabili_category` required; `Idempotency-Key` header recommended); with `store_id`, pickup is the store |
| POST | `/api/v1/customer/bookings/pasuyo` | Create a Pasuyo booking |
| GET | `/api/v1/customer/bookings` | The customer's bookings, newest first, paginated |
| GET | `/api/v1/customer/bookings/{id}` | One booking with its status history |
| POST | `/api/v1/customer/bookings/{id}/cancel` | Cancel with an optional reason |

Each location is `{ address, landmark?, details?, latitude, longitude }`. The app offers matching places as the customer types (pick one and the pin jumps there), fills the address from the map pin when it is dragged, and the customer adds a landmark and door-level details; riders see all of it. See [ADR 0009](adr/0009-map-picker-and-geocoding.md).

Creation is rate limited (`throttle:bookings`, 10/min per customer). Every response uses the standard envelope; money fields are `{ centavos, currency, formatted }`.

## Rider API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/rider/profile` | Online flag, last location |
| PUT | `/api/v1/rider/availability` | `{ is_online }` |
| PUT | `/api/v1/rider/location` | `{ latitude, longitude }`, throttled by the app |
| GET | `/api/v1/rider/jobs/available` | Open bookings within reach, nearest first (409 if offline, 422 without a fresh location) |
| GET | `/api/v1/rider/jobs/active` | The job in progress, or `data: null` |
| GET | `/api/v1/rider/jobs` | Job history, newest first |
| GET | `/api/v1/rider/jobs/{id}` | One job (open, or assigned to this rider) |
| POST | `/api/v1/rider/jobs/{id}/accept` | First rider wins; 409 otherwise |
| POST | `/api/v1/rider/jobs/{id}/status` | `{ status: picking_up \| in_transit \| completed }` |

Bookings returned to riders include `customer { name, phone }`; bookings returned to customers include `rider { name, phone }` once assigned.

## Admin API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/dashboard` | Today's bookings by status, in-progress and searching counts, riders online, revenue |
| GET | `/api/v1/admin/fare-settings` | Both tariffs |
| PUT | `/api/v1/admin/fare-settings/{service_type}` | Update a tariff (pesos as decimal strings); clears the cache |
| GET | `/api/v1/admin/users?role=&search=` | Users, newest first, paginated |
| GET | `/api/v1/admin/riders?search=` | Riders with online flag, location and active job reference |
| POST | `/api/v1/admin/riders` | Create a rider account `{ name, phone }` |
| POST | `/api/v1/admin/users/{id}/deactivate` · `/reactivate` | Block or unblock sign-in; deactivation revokes tokens and takes a rider offline |
| GET | `/api/v1/admin/bookings?status=&service_type=&search=` | Every booking with both parties |
| GET | `/api/v1/admin/bookings/{id}` | One booking with history |
| GET | `/api/v1/admin/bookings/{id}/rider-candidates` | On-duty riders for a booking: distance to pickup, active job, wallet balance, `is_available`, `unavailable_reason` |
| POST | `/api/v1/admin/bookings/{id}/assign-rider` | Dispatch `{ rider_id }`: booking becomes `accepted` with that rider; `409` if the user is not an active rider, the rider is busy or below the wallet minimum, or the booking is no longer `searching`. Off-duty riders can be assigned |
| POST | `/api/v1/admin/bookings/{id}/cancel` | Support cancellation at any stage before delivery; `reason` required |

## Live rider tracking

While a rider is on a job (`accepted`, `picking_up`, `in_transit`), the rider app reads the device
position and sends it every 15 seconds (`PUT /rider/location`, `useLiveLocationReporting`). The
customer's booking page polls every 10 seconds and shows a map with the rider, the pickup (amber) and
the drop-off (dark green), plus how old the position is; past 2 minutes it is marked as the last known
position.

`GET /customer/bookings/{id}` carries `rider_location { latitude, longitude, updated_at }` only for the
booking's own customer and only while the job is active; it is `null` before a rider accepts and after
delivery or cancellation, and never appears in the bookings list. Riders on web must allow location in
the browser, and the page must be on `https` or `localhost` for the browser to share it.
