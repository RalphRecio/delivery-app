# App

Expo SDK 58 / React Native app for customers, riders and admins. Expo Router, TanStack Query, Zustand, Zod, Axios.

## Setup

```sh
npm install
cp .env.example .env          # EXPO_PUBLIC_API_URL -> the backend (http://localhost:8000/api/v1)
npx expo start                # then press i / a / w
```

On a physical device replace `localhost` in `.env` with your machine's LAN address.

`docker compose up -d` at the repo root runs the web build in a container on http://localhost:8082
instead (API calls are proxied to the `api` container). Native builds still start from the host.

Sign in with a seeded number (for example `0917 000 0003`) and code `123456`; see `docs/auth-flow.md` at the repo root.

## Install on a phone (PWA)

The web build is installable. Open the site over https (the dev tunnel, or the production
host) and use **Add to Home Screen** (iOS Safari share sheet) or **Install app** (Android Chrome
menu); it then opens full screen with the green theme and its own icon. The pieces:

| File                                 | Role                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `public/manifest.webmanifest`        | Name, icons, start URL, theme colour, home-screen shortcuts                    |
| `public/icons/`                      | 192 / 512 / maskable 512 / Apple touch 180, rendered from a green bicycle mark |
| `public/sw.js`                       | Service worker: network only, shows `offline.html` when a page cannot load     |
| `src/shared/lib/pwa/setupPwa.web.ts` | Adds the manifest link and Apple meta tags at runtime, registers the worker    |

The head tags are added at runtime because the default `single` web output ignores
`app/+html.tsx`. Service workers need a secure context, so a plain LAN `http://` address runs
the app but cannot install it.

**Notifications:** the installed app can receive web push even when closed. Users turn it on
from the profile (customer) or home (rider) screen; `src/features/notifications` subscribes the
browser and registers it with the API. Send a test from the backend:

```sh
php artisan push:test customer@example.com --title="Rider on the way" --body="Rita is 5 minutes out" --url=/customer/bookings
```

iPhones need iOS 16.4+ and the app added to the Home Screen first; Android Chrome works from the
browser or the installed app.

## Scripts

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run lint`         | ESLint (Expo rules + Prettier), zero warnings     |
| `npm run lint:fix`     | ESLint with fixes                                 |
| `npm run format:check` | Prettier check                                    |
| `npm run typecheck`    | `tsc --noEmit` (strict, noUncheckedIndexedAccess) |
| `npm test`             | Jest + React Native Testing Library               |
| `npm run check`        | all of the above, in CI order                     |

## Layout

```
app/                 Expo Router screens by audience: (auth) group, then /customer, /rider, /admin segments
src/features/<f>/    api/ hooks/ components/ schemas/ types.ts index.ts  (import via "@/features/<f>")
src/features/auth    phone + OTP sign-in: PhoneNumberForm, OtpCodeForm, useVerifyOtp, useLogout, useCurrentUser
src/features/booking BookingForm (quote → confirm), BookingDetails, useBookings, useCreateBooking, useCancelBooking
src/features/map     MapPicker (.web = Leaflet/OSM, native = react-native-maps), LocationPicker, useCurrentPosition, reverse geocoding
src/features/store   StoreCard, ProductRow (stepper), CartBar, OrderSummary, useStores/useStore; order lives in src/stores/cartStore
src/features/customer CustomerShell (desktop top bar), ServiceCard, GreetingHeader
src/features/admin   AdminShell (desktop sidebar + header), ui/ console kit (AdminButton, Panel, StatusPill, SearchField, UnderlineTabs; tokens in src/config/adminTheme.ts), BookingsTable/UsersTable/StoresTable, StatTile, BookingPanels, DispatchPanel, FareSettingForm, CreateRiderForm, UserRow (phone), support cancel
src/shared/ui        + DataTable, Pagination; src/shared/hooks/useBreakpoint decides desktop (≥1024 px) vs stacked
src/features/rider   AvailabilitySwitch, LocationPanel, JobCard, JobActions, useAvailableJobs (polls), useAcceptJob, useProgressJob
src/shared/ui        Button, Input, Alert, Badge, Card, Text, Screen (design system)
src/shared/lib/api   apiRequest(config, schema), ApiError, Axios client
src/shared/lib/format formatMoney, formatDistance
src/shared/lib/storage secure session storage (keychain on native, localStorage on web via .web.ts)
src/stores           Zustand: authStore (session), cartStore (the Pabili order being assembled)
src/config           env (Zod-validated), queryClient, theme (celadon & white tokens; the only place colours live)
```

Maps: web uses OpenStreetMap tiles and Nominatim (no key). Native uses `react-native-maps` and `expo-location`;
an Android dev build needs `android.config.googleMaps.apiKey` in `app.json` (Expo Go has its own).
Browser geolocation works on `localhost` or `https` only.

Rules that ESLint enforces: no `any`, type-only imports via `import type`, and no deep imports into another feature.
See the root `CLAUDE.md` for the full conventions and `docs/architecture.md` for the layering.

## Opening the web app from another device or a tunnel

In development the web app calls the API on its own address (`/api/v1`) and the Expo dev
server forwards those calls to Laravel on port 8000 (`metro.config.js`). So only the Expo
port (8082) needs to be shared: open it on a phone on the same network, or forward it with
VS Code port forwarding or any tunnel, and sign-in works with no CORS setup. Keep
`php artisan serve` running on the same machine. The native apps still use
`EXPO_PUBLIC_API_URL`, which must be an address the phone can reach.
