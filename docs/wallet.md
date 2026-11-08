# Rider wallet

Riders keep a wallet balance. Commission on completed cash bookings is deducted from it, and riders below the minimum cannot accept jobs until they top up with GCash or Maya through PayMongo. Design and rules: [ADR 0016](adr/0016-rider-wallet-ledger-and-commission.md).

## API (rider token)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/rider/wallet` | `balance`, `minimum_balance`, `can_accept_bookings`, `shortfall`, `topup_limits` |
| GET | `/api/v1/rider/wallet/transactions?type=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=&per_page=` | Ledger, newest first; dates are Philippine days |
| POST | `/api/v1/rider/wallet/topups` `{ amount: "500", return_url }` | Creates a pending top-up and a PayMongo checkout; returns `checkout_url` |
| GET | `/api/v1/rider/wallet/topups/{id}` | Status for polling: `pending`, `paid`, `failed`, `expired` |
| POST | `/api/v1/webhooks/paymongo` | PayMongo only; verified by `Paymongo-Signature` |

Accepting a job below the minimum answers `409` with `errors.wallet_balance`.

## Settings

`backend/config/wallet.php`: minimum balance ₱150, top-up ₱100 to ₱5,000, expiry 60 minutes. Commission per service: admin **Tariffs** screen (default 10%).

## PayMongo sandbox setup

1. Create a PayMongo account and open **Developers → API keys** in test mode. Copy the secret key (`sk_test_…`).
2. The webhook must reach your machine over HTTPS. Expose the Laravel API (port 8000) with a tunnel, for example VS Code port forwarding set to Public, and note the URL.
3. Register the webhook (once):
   ```sh
   curl https://api.paymongo.com/v1/webhooks \
     -u sk_test_YOUR_KEY: \
     -H 'Content-Type: application/json' \
     -d '{"data":{"attributes":{"url":"https://YOUR-TUNNEL/api/v1/webhooks/paymongo","events":["checkout_session.payment.paid","payment.failed"]}}}'
   ```
   The response contains `secret_key` (`whsk_…`): that is the webhook secret.
4. In `backend/.env`:
   ```sh
   WALLET_GATEWAY=paymongo
   PAYMONGO_SECRET_KEY=sk_test_...
   PAYMONGO_WEBHOOK_SECRET=whsk_...
   PAYMONGO_LIVE_MODE=false
   ```
5. Run the scheduler so unpaid top-ups expire: `php artisan schedule:work`.
6. In the rider app open **Wallet → Top up**, pick an amount and continue. PayMongo's test checkout lets you choose GCash or Maya and authorise or fail the payment. The status screen updates when the webhook arrives.

For production, use live keys, set `PAYMONGO_LIVE_MODE=true` (signatures are then checked against the `li` value), and register the webhook with the production URL.

## Support tools

- Manual correction: `php artisan wallet:adjust rider@example.com -- -50.00 --reason="Double commission on BK-123" --by=admin@example.com`
- Refund a commission: cancel the completed booking from the admin booking page with a reason.
