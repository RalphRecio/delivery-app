# ADR 0018: The admin console follows the Suhay ERP design

Date: 2026-11-03 · Status: accepted

## Context

The desktop admin area used the customer app's green theme and pill-shaped controls, with
content capped at 720 px on wide screens. Operations staff also use the Suhay ERP (PRPO)
console and asked for the same look here, so one set of habits carries across tools.

## Decision

- **Separate tokens for the console.** `app/src/config/adminTheme.ts` holds the slate greys,
  the blue used for the selected navigation row, the indigo used for primary actions, and the
  soft status-pill palette. The customer and rider apps keep `theme.ts` (green) untouched.
- **A small console kit** in `src/features/admin/ui`: `AdminButton` (32 px, 4 px radius,
  indigo / outline / ghost / danger), `Panel` (bordered white section with a header rule),
  `StatusPill` (rectangular, soft fill, one hue per booking stage via `bookingStatusTone`),
  `SearchField` and `UnderlineTabs`. Desktop admin screens are built from these; the mobile
  admin branches keep the shared `Button`, `Card` and `Badge` so phones stay consistent with
  the rest of the app.
- **Shared components that only the console uses** (`DataTable`, `Pagination`) take the slate
  styling directly. `Input` gains a `size="compact"` and `FilterChips` a `variant="console"`
  so admin forms can use them without a second component.
- **Layout.** `AdminShell` is a 256 px white sidebar with grouped navigation, an active-row
  marker and the signed-in admin at the bottom, plus a 56 px header bar naming the page.
  Pages use the full canvas: list pages are a tab strip over one panel holding the search box,
  actions and table; the booking page is a two-column record view with the dispatch panel,
  fare, history and support cancellation in the side column; the dashboard is a row of stat
  cards with a tinted icon tile.

## Consequences

- Two visual systems live in the app on purpose. New admin desktop work must use the console
  kit; the shared map picker (`LocationPicker`) still shows the green theme inside the store
  form, accepted for now because it is a customer-facing component.
- The reference implementation is in a different stack (React + Tailwind), so the match is by
  tokens and proportions, not shared code.
