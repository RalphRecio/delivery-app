# ADR 0014: Four customer offerings on two service types; Pasabay renamed Pasuyo

Date: 2026-11-03 · Status: accepted

## Decision

- Customers choose from four offerings: **Pabili** (pharmacy, grocery and more), **Pabili Food** (food takeout / food delivery), **Pabili Pet Food** (cat and dog food and more) and **Pasuyo** (may ipapakuha o ipapahatid).
- The three Pabili offerings are one service type, `pabili`, with a required `pabili_category` (`grocery`, `food`, `pet_food`; `PabiliCategory` enum, nullable column on `bookings`). They share the booking flow, the state machine and the Pabili tariff. The category changes the wording of the form and tells the rider what kind of store to go to.
- The pickup-and-deliver service is renamed from Pasabay to Pasuyo end to end: enum value `pasuyo`, route `POST /customer/bookings/pasuyo`, class names, docs. A data migration renames existing rows in `bookings` and `fare_settings`.
- The API adds `service_label` ("Pabili · Food takeout", "Pasuyo") and `pabili_category_label` so every list and header names a booking the same way without each client rebuilding the string.
- In the app the offerings live in one list (`features/booking/lib/offerings.ts`): the home cards, the desktop navigation, the form switcher and the route params (`serviceType` + `category`) all derive from it.

## Why

- A category, not three more service types, keeps the tariff table and the state machine at two rows. Nothing about fares or statuses differs between buying groceries and buying lunch; only the words and the destination do. If a category ever needs its own pricing, a tariff per category can be added without touching the booking flow.
- Renaming rather than aliasing avoids a code name that contradicts every screen and conversation about the product.

## Consequences

- Clients must send `pabili_category` with every Pabili booking; bookings made before the column existed were backfilled as `grocery`.
- Any saved link to `/customer/bookings/pasabay` or a stored `service_type` of `pasabay` is invalid after the migration.
- The admin tariff screen still shows two tariffs (Pabili, Pasuyo); the category is visible on bookings, not on tariffs.
