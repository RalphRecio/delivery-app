# ADR 0002: PostgreSQL 17 with PostGIS

Date: 2026-11-02 · Status: accepted

## Decision

The only database is PostgreSQL with the PostGIS extension. Locations are stored as `geography(Point, 4326)` columns with GIST indexes.

## Why

- Rider matching is a nearest-neighbour search over live rider positions. PostGIS answers "riders within N metres of this point" with an index instead of application-side maths.
- This product is standalone: it does not integrate with the company's MSSQL systems or the UMS, so there is no reason to inherit that stack.
- `pdo_pgsql` is available locally and in CI without extra drivers.
- The container image is `imresamu/postgis:17-3.5` rather than `postgis/postgis`: the official image publishes amd64 only; the former is the same maintainer's multi-arch build and runs natively on Apple Silicon.

## Consequences

- The test suite runs against a real PostgreSQL database (see ADR 0004), not SQLite.
- The `postgis` extension is enabled by the first migration so a fresh database always has it.
- Redis (via `predis`, no PHP extension needed) is used for cache and queues from the start, so fare settings can be cached and jobs can be dispatched without changing drivers later.
