# ADR 0020: The web build is an installable PWA

Date: 2026-11-03 · Status: accepted

## Context

Customers and riders reach the app through the web build on their phones. Without store
listings, "Add to Home Screen" is the closest thing to an installed app: an icon, full-screen
launch, and the green status bar.

## Decision

- **Web app manifest** at `public/manifest.webmanifest` with the brand name, `standalone`
  display, green theme colour, 192 / 512 / maskable icons and two shortcuts (Book a Pasuyo,
  My bookings). Expo SDK 58 no longer generates one, so it is a static file.
- **Icons** are rendered from a simple white bicycle on the brand green, kept inside the central
  80 % so the same image serves as the maskable icon. The Expo placeholder icon is untouched
  for native builds, which are not shipped yet.
- **Install tags at runtime.** Expo's `single` web output (the default, used by the dev server
  and `expo export`) serves its own HTML template and never renders `app/+html.tsx`. So
  `src/shared/lib/pwa/setupPwa.web.ts` appends the manifest link, Apple meta tags and touch icon
  when the page lacks them, and registers the service worker. The native file is a no-op.
- **A minimal service worker.** It caches nothing but `offline.html` and answers navigations
  from the network, falling back to the offline page. No app-shell caching: a deploy is live on
  the next load and the Metro dev server keeps hot reloading.

## Consequences

- Install needs https (or localhost). The dev tunnel qualifies; a LAN IP does not.
- Chrome's installability check (DevTools `Page.getInstallabilityErrors`) reports no errors
  against the dev server; iOS uses the Apple tags and the 180 px touch icon.
- Offline use is limited to the fallback page by design; caching API data is a separate
  decision.

## Addendum, 2026-11-03: web push notifications

- **Server:** `laravel-notification-channels/webpush` (VAPID keys in `.env`, generated with
  `php artisan webpush:vapid --show`). `User` has push subscriptions, one per browser that
  turned notifications on. `PushMessageNotification` (title, body, in-app URL, optional tag) is
  the one notification class; features send it through `$user->notify(...)`.
- **Endpoints:** `GET /api/v1/auth/push/public-key` (public), `POST` and `DELETE`
  `/api/v1/auth/push-subscriptions` for the signed-in user, any role.
- **App:** `src/features/notifications` holds the browser side (permission, PushManager
  subscription, API registration) and the "Turn on notifications" card shown on the customer
  profile and the rider home. The request runs from a tap because iOS only prompts on a user
  gesture. The service worker shows the notification and opens the URL on tap.
- **Test:** `php artisan push:test customer@example.com --title="..." --body="..." --url=/customer`
  or from tinker: `User::where('email', 'customer@example.com')->first()->notify(new PushMessageNotification('Hi', 'Hello', '/customer'))`.
- No booking event sends a push yet; that is the next step once the test proves delivery on
  real phones. Delivery is synchronous for now (no queue) so the test is immediate.
