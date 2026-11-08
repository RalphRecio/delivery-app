# ADR 0013: Pause the store catalogue; Pabili is a typed list

Date: 2026-11-03 · Status: reversed the same day (the catalogue is back on; see Update below)

## Decision

- The store catalogue from [ADR 0012](0012-store-catalogue-for-pabili.md) is switched off in the app behind `features.storeCatalogue` (`app/src/config/features.ts`). Nothing is deleted: the store screens, cart store, API client and backend endpoints stay in place, and the two store routes redirect to the Pabili form while the flag is off.
- Pabili is a direct-entry booking: the customer types the shopping list, sets a purchase budget and pins the drop-off. There is no pickup to fill in: the rider chooses a store near the drop-off. The home card and the desktop navigation go straight to the form.
- Server rule for a Pabili with neither `store_id` nor `pickup`: the booking's pickup is recorded as "Rider's choice: any store near the drop-off" at the drop-off point, so rider matching happens near the customer. The fare is quoted at zero distance (base fare + service fee, subject to the minimum fare). `POST /customer/bookings/quote` accepts a Pabili without a pickup for the same reason; Pasuyo still requires one.
- The shopping list is a table (item, quantity, note, remove) rather than a stack of labelled fields, so a list reads the way it would on paper.
- Optional information lives under an "Other details" disclosure that the customer opens on demand. It holds the notes for the rider; it opens itself when a field inside has a validation error.

## Why

- The catalogue needs seeded menus and an admin screen before it is useful outside demos. Until then a typed list is faster for customers and keeps riders' instructions in one place.
- A flag, not a deletion, keeps the catalogue one line away from returning and avoids churn in the API, which already accepts Pabili bookings with or without a `store_id`.

## Consequences

- `POST /customer/bookings/pabili` keeps its shape; `pickup` is now optional for Pabili and the app sends neither `pickup` nor `store_id` while the flag is off.
- The zero-distance fare is a placeholder tariff decision: if a Pabili without a store should carry a flat shopping charge, raise the Pabili base fare or add a dedicated setting rather than inventing a distance.
- The "Can't find the store? Describe it instead" path and the `mode=manual` query parameter are redundant while the flag is off and come back with it.
- To re-enable: set `storeCatalogue: true`; the nav, home card, desktop switcher and store routes follow.

## Update 2026-11-03: catalogue resumed

`features.storeCatalogue` is `true` again. Each Pabili card now opens the stores that fit it (`GET /customer/stores?pabili_category=`): Pabili (pharmacy and grocery) lists grocery, pharmacy, convenience, bakery and other stores; Pabili Food lists restaurants and bakeries; Pabili Pet Food lists grocery, convenience and other stores until a pet-shop category exists. The mapping lives in `PabiliCategory::storeCategories()`. A store's page lists its available items; adding one starts the order and "Continue" opens the booking with the store as pickup. "Can't find the store? Describe it instead" still leads to the typed list (no pickup, rider's choice), keeping the category.

Both ways stay first-class: the store list opens with a **Book without a store** card ("Type my list"), and the typed-list booking page offers **Prefer a specific store?** ("Choose a store"). A customer can switch either way before booking.
