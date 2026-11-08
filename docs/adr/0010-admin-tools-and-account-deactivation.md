# ADR 0010: Admin tools in the same app, and account deactivation

Date: 2026-11-02 · Status: accepted

## Decision

- Admin screens live in the same Expo app under the `(admin)` route group, guarded by the `admin` role, rather than in a separate web dashboard. They cover: a daily dashboard, tariff editing, rider account creation, user deactivation and reactivation, a bookings list with filters, and support cancellation.
- Only admins create rider accounts (`POST /admin/riders`). A rider then signs in with OTP like anyone else; the role is never chosen at sign-in.
- Deactivation sets `users.deactivated_at`, revokes every token, and takes a rider offline. A deactivated user cannot sign in (403 on OTP verification) and any request through a role-guarded group is refused with the same message.
- Support may cancel a booking at any status before `completed`, with a mandatory reason that is written to the status log with the admin as actor. Customers remain limited to the pre-pickup statuses.
- Tariff updates go through `UpdateFareSettingAction`, which clears the cached tariff. Existing bookings keep their fare snapshot.
- Admin endpoints are plain, filtered, paginated lists; no reporting warehouse. The dashboard is a handful of counts over today's rows.

## Why

- One app and one API keep the conventions, auth and design system shared; a separate dashboard would duplicate all three for a small operations team.
- Deactivation beats deletion: bookings and status logs keep their foreign keys and history, and a mistake is reversible.
- Mandatory reasons on support cancellations are what make the status log useful in a dispute.
- Counts over today's rows need no caching at this scale and are simple to read in the code.

## Desktop layout

On screens 1024 px and wider the admin area renders inside `AdminShell`: a fixed left sidebar (brand, grouped navigation, signed-in admin with sign-out) and a page header, with lists shown as data tables that paginate server-side (`page`, `per_page` ≤ 100) and show "Showing x–y of n". Below that width the same screens stack like the phone app, with cards and a Back button. The breakpoint lives in `shared/hooks/useBreakpoint`.

## Consequences

- An admin cannot deactivate their own account from the app (the button is hidden); the API still allows it, which is acceptable with more than one admin.
- Lists are paginated server-side but the app shows the first page only; infinite scroll arrives when a list outgrows it.
- There is no admin audit trail beyond logs and the booking status log; a dedicated `admin_actions` table is the next step if compliance needs it.
