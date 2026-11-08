# ADR 0003: Domain-first folder layout in the Laravel backend

Date: 2026-11-02 · Status: accepted

## Decision

Business code lives under `app/Domain/<Domain>/` (Actions, Data, Enums, Events, Exceptions, Jobs, Listeners, Models, Policies, Services). `app/Http` is a thin delivery layer. External services live under `app/Infrastructure`.

## Why

- Readers find everything about a booking in one folder instead of across `Models/`, `Services/`, `Events/`, `Jobs/`.
- One Action per use case keeps controllers trivially thin and makes the "where does X happen?" question answerable by file name.
- Domain exceptions carry their own HTTP status, so a single renderer produces the API envelope for every failure.

## Consequences

- Laravel's default `app/Models/User.php` moved to `app/Domain/Auth/Models/User.php` in the auth phase (see ADR 0006).
- Pint, Larastan and Pest are configured against `app/` as a whole, so no extra configuration is needed when a new domain folder appears.
