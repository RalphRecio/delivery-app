# ADR 0004: Tests run against a real PostgreSQL database

Date: 2026-11-02 · Status: accepted

## Decision

`phpunit.xml` points the test suite at `delivery_app_test` on the local PostGIS container (host port 5440). CI starts the same image as a service.

## Why

- The schema uses PostGIS types, row-level locking and `SELECT ... FOR UPDATE` semantics. SQLite cannot execute those, so a green SQLite suite would say nothing about the concurrency and geospatial behaviour the standards single out as test priorities.
- Pest's `RefreshDatabase` keeps each test isolated with transactions, so the suite stays fast.

## Consequences

- `docker compose up -d` is a prerequisite for running tests locally. The database and the PostGIS extension are created automatically by `docker/postgres/init/`.
