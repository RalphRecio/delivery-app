# ADR 0016: Rider wallet as an append-only ledger; commission on cash bookings

Date: 2026-11-03 · Status: accepted

## Decision

- Every rider has one `wallets` row. The balance is **never stored**: it is `SUM(amount_centavos)` of `wallet_transactions`, an append-only ledger (signed integer centavos). The model refuses updates and deletes, and a PostgreSQL trigger refuses them too; corrections are new `adjustment` or `refund` rows.
- Ledger types: `topup` (+), `commission` (−), `refund` (+, reverses a commission), `adjustment` (±, reason required; `php artisan wallet:adjust` for now).
- **Commission** is a per-service rate in basis points on `fare_settings.commission_rate_bps` (default 1000 = 10%, editable on the admin Tariffs screen). Each booking copies the rate into `bookings.commission_rate_bps` at creation. When a rider completes a booking whose payment method is collected by the rider (cash), the wallet is charged `−(total fare × rate)`, rounded half away from zero, in the same transaction as the status change. The fare (base + distance + service fee) never includes Pabili item cost, which is a separate purchase budget, so items are excluded by construction. Bookings created before this change have a null rate and are not charged.
- **Minimum balance**: a rider below ₱150 cannot accept bookings (`409`, `errors.wallet_balance`, which the app turns into a "Top up" shortcut).
- **Refund**: support may now cancel a *completed* booking (a dispute) from the admin booking page; that cancellation refunds the commission in the same transaction. This is a support-only move (`BookingStatus::canSupportTransitionTo`); for customers and riders a completed booking stays final, and `isTerminal()` is unchanged.
- **Top-ups** go through PayMongo Checkout (GCash, Maya) behind `Domain\Payment\Contracts\PaymentGateway`. A `topup_requests` row is created `pending`; the rider pays on PayMongo's page; only the signed webhook (`POST /api/v1/webhooks/paymongo`, HMAC-SHA256 over `timestamp.raw_body`) credits the wallet. The return URL only lands the rider on a screen that polls the server. Limits ₱100 to ₱5,000. Unpaid requests expire after 60 minutes (`wallet:expire-topups`, every minute); a payment that still arrives later is credited, since the rider's money was taken.

## Integrity

- Every balance change runs in a DB transaction that locks the wallet row (`SELECT … FOR UPDATE`); lock order is booking → top-up request → wallet everywhere.
- At most one commission and one refund per booking: checked under the lock and enforced by `UNIQUE (booking_id, type)`.
- A top-up is credited once: the request row is locked and checked, `wallet_transactions.topup_request_id` is unique, and `topup_requests.gateway_payment_id` is unique. Repeated webhooks are no-ops and still answer 200 so PayMongo stops retrying.
- A paid webhook whose amount differs from the request is logged and not credited.

## Consequences

- Riders start at ₱0 and must top up ₱150 before their first job. Local seeded riders get a ₱500 starting adjustment.
- The schema leaves room for payouts (a `payout` type and a requests table like `topup_requests`), earnings from online-paid bookings (`PaymentMethod::isCollectedByRider()` already separates them), and an admin wallet screen; none are built.
- True concurrency is enforced by row locks and unique constraints; the test suite exercises idempotency and interleaved writes on one connection rather than parallel processes.
