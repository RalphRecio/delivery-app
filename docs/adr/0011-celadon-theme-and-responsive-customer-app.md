# ADR 0011: Celadon-and-white theme, and separate phone and desktop layouts for customers

Date: 2026-11-02 · Status: accepted

## Decision

- The design tokens in `src/config/theme.ts` are the single source of colour: a deeper celadon green (`#3C8F6E`) as the brand colour, pale celadon (`#DDF0E3`) for tints, selected states and info badges, a celadon-tinted off-white (`#F2F8F4`) for page canvases, and white panels with a soft border and shadow. Buttons are pill-shaped; inputs and cards use a 14 px radius. No component hard-codes a hex value.
- The customer area has two layouts chosen by `useBreakpoint()` (1024 px):
  - Phone: a stacked screen with a greeting panel, two service cards, and the booking list; booking form and detail scroll vertically.
  - Desktop: `CustomerShell` adds a top bar (brand, Home and Book links, account, sign-out) and a centred 1120 px column. The home page shows the services side by side and splits bookings into active and past columns. The booking form is two cards, "Where" (maps) and "What to buy / send" (details and fare). The detail page puts the trip beside the fare and history.
- The sign-in screens sit in a centred card on the celadon canvas on wide screens.
- The admin area keeps its sidebar layout (ADR 0010); the rider area stays phone-first.

## Why

- One palette file means the celadon theme reached every screen, including admin tables and badges, without touching components.
- Customers on a laptop expect a web app, not a phone screen in the middle of the page; a top bar and columns use the width without duplicating screens. The same screen files render both layouts, so logic and tests stay single.
- Service cards with an icon and one-line blurb make the two products obvious on first open, which the old text-only buttons did not.

## Consequences

- Icons come from `@expo/vector-icons` (bundled with Expo). On web they render as font glyphs, so end-to-end scripts match buttons by accessibility label rather than raw text.
- `app/+html.tsx` sets the web page background and the input focus ring colour; native has no equivalent and needs none.
- Light theme only for now; dark mode would add a second token set, not new components.
