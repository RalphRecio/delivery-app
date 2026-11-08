# Delivery App

Booking platform for **Pabili** (buy-and-deliver: pharmacy and grocery, food takeout, pet food) and
**Pasuyo** (may ipapakuha o ipapahatid: fetch-and-deliver) services.
Monorepo with a Laravel API and an Expo mobile app. Conventions live in [CLAUDE.md](CLAUDE.md).

| Path        | What it is                                                     |
|-------------|----------------------------------------------------------------|
| `backend/`  | Laravel 13 API: PHP 8.4, PostgreSQL + PostGIS, Redis, Sanctum  |
| `app/`      | Expo SDK 58 app: Expo Router, TanStack Query, Zustand, Zod     |
| `docs/`     | Architecture, auth flow, booking flow, ADRs, user manual (pptx) |
| `docker/`   | Dockerfiles, entrypoints and PostgreSQL init scripts           |

## Run everything with Docker

```sh
cp backend/.env.example backend/.env && cp app/.env.example app/.env   # first time only
docker compose up -d --build
```

That starts PostgreSQL (host port 5440), Redis (6390), the API on http://localhost:8000
(with its queue worker and scheduler) and the Expo web app on http://localhost:8082.
The API container installs Composer dependencies, migrates and seeds on start; the app
container installs npm dependencies into its own volume. Source folders are bind-mounted,
so edits apply without a rebuild. `backend/.env` needs an `APP_KEY`: run
`docker compose run --rm api php artisan key:generate` once on a fresh clone.

| Need                | Command                                                     |
|---------------------|-------------------------------------------------------------|
| Logs                | `docker compose logs -f api app queue scheduler`            |
| Artisan             | `docker compose exec api php artisan <command>`             |
| Backend checks      | `docker compose exec api composer run check`                |
| App checks          | `docker compose exec app npm run check`                     |
| Stop                | `docker compose down` (add `-v` to drop the database too)   |

Rebuild the images (`--build`) only when a Dockerfile changes. For a phone, run
`npx expo start` on the host instead of the `app` container (see below).

## Run on the host (alternative)

```sh
# 1. Infrastructure only (PostgreSQL on 5440, Redis on 6390)
docker compose up -d postgres redis

# 2. Backend
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed       # seeds one admin, rider and customer account
php artisan serve                # http://localhost:8000/api/v1/health

# 3. App
cd ../app
npm install
cp .env.example .env
npx expo start

# 4. Git hooks (once, from the repo root)
npm install
```

## Signing in locally

Open the app and sign in with one of the seeded accounts (password `password` for all of them):

| Role     | Email                | Phone         |
|----------|----------------------|---------------|
| admin    | admin@example.com    | 0917 000 0001 |
| rider    | rider@example.com    | 0917 000 0002 |
| rider    | rider2@example.com   | 0917 000 0004 |
| customer | customer@example.com | 0917 000 0003 |

Or tap **Create an account** to register as a new customer. Details in [docs/auth-flow.md](docs/auth-flow.md).

As a customer, pick one of the four services on the home screen: **Pabili**, **Pabili Food** or
**Pabili Pet Food** to type a shopping list and a budget (the rider chooses a store near you), or
**Pasuyo** to have something fetched and delivered. Drop the pin for the drop-off (search a place, **Use my location**, or
**Use sample locations** for a quick test), add a landmark and details, review the fare and confirm. Then, in a second browser (or a private window), sign in
as a rider, switch **Online**, tap **Use sample location**, open the job and tap **Accept job**.
Walk it through pickup and delivery; the customer screen updates on its own. Sign in as the admin
(`0917 000 0001`) for the dashboard, tariffs, rider accounts and support cancellations. Rules and the API are in
[docs/booking-flow.md](docs/booking-flow.md).

## Quality gates

| Where      | Command              | Runs                                   |
|------------|----------------------|----------------------------------------|
| `backend/` | `composer run check` | Pint, Larastan (level 6), Pest          |
| `app/`     | `npm run check`      | ESLint + Prettier, `tsc --noEmit`, Jest |

The same gates run in CI (`.gitea/workflows/ci.yml`) on every push, and the
relevant formatters run on staged files before every commit.

Riders have a wallet: commission on cash bookings is deducted from it, and top-ups go through PayMongo (GCash, Maya). Setup and rules: [docs/wallet.md](docs/wallet.md).
