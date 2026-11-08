# ADR 0021: The rider wallet is switched off for now

Date: 2026-11-07 · Status: accepted

## Context

ADR 0016 made riders keep a ₱150 wallet balance to accept jobs and took the platform
commission from that wallet when a cash booking completed. For launch, riders should work
without depending on the wallet: no top-up before the first job, and no commission
deducted.

## Decision

- **One server switch, `wallet.enabled`** (`WALLET_ENABLED`, default `false`). While off:
  - accepting a job skips the minimum-balance check;
  - completing a cash booking charges no commission;
  - the dispatch list never marks a rider unavailable for a low balance.
- **One app switch, `features.riderWallet`** (default `false`). While off, the rider tab bar
  has only Jobs and Settings, and the Jobs screen shows no low-balance warning.
- **Nothing is deleted.** The ledger, top-ups, wallet screens, routes and admin tools stay.
  Commission refunds still work for any commission charged before the switch.
- Tests run with the wallet on (`phpunit.xml`) so ADR 0016 stays covered; the off state has
  its own tests in `tests/Feature/Wallet/WalletSwitchedOffTest.php`.

## Consequences

- Turning the wallet back on means setting `WALLET_ENABLED=true` and `riderWallet: true`
  together. Bookings completed while it was off are never charged commission afterwards.
- The wallet screens are still reachable by typing `/rider/wallet`; they are hidden, not
  removed.
