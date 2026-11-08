# ADR 0019: Customer app component refresh, Grab-style home

Date: 2026-11-03 · Status: accepted

## Context

The customer app kept the celadon palette (ADR 0011) but its components read as a first draft:
pill buttons everywhere, plain "No bookings yet" captions, a four-card service grid, and no
search or filters on lists. Operations asked for a modern, familiar feel and pointed at two
references: a mobile approvals app (big title with a count, search box beside a filled button,
square filter chips, illustrated empty states) and the Grab home (greeting card over a green
banner with a row of service icons, then list rows with a chevron).

## Decision

- **Colours stay; shapes change.** `theme.ts` gains `radius.control` (12 px, buttons, inputs,
  chips) and `radius.card` (16 px, cards). `Button` and `Input` lose the pill, grow to 50 px and
  take an optional leading icon. `FilterChips` are square-cornered and fill green when selected.
  `Badge` is a rounded rectangle. Screen titles are heavier and tighter.
- **Two shared pieces for every list screen.** `ScreenHeader` (title, count or purpose line,
  optional trailing element) and `EmptyState` (icon in a soft circle, bold title, hint, optional
  action). Bookings, stores and messages use them; the bookings list also gets a search box and
  All / In progress / Delivered / Cancelled chips, filtered on the client since the customer's
  list is small.
- **Grab-style home.** The green banner carries only the wordmark and bell. The greeting card
  overlaps it and holds the four services as icon tiles with short labels (`shortTitle` on
  `ServiceOffering`). Below: the rider status card, then the same four services as list rows
  with a description and chevron, so a first-time customer still sees what each one is.
- **Booking rows** show the service, reference and date, the status badge, the drop-off with a
  pin icon, and the fare with a chevron.

## Consequences

- The rider and auth screens share `Button`, `Input` and `Card`, so they pick up the new shapes
  without separate work; the admin console keeps its own kit (ADR 0018).
- The customer desktop layout keeps its top bar and content column; the home's service rows
  wrap into two columns there.
