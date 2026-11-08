# ADR 0005: Money is an integer number of centavos

Date: 2026-11-02 · Status: accepted

## Decision

Every monetary amount is a `Domain\Shared\ValueObjects\Money` holding an `int` of centavos. Database columns are `bigint`. The API returns `{ "centavos": 12350, "currency": "PHP", "formatted": "₱123.50" }` and the app formats with `formatMoney(centavos)`.

## Why

- Floats cannot represent 0.10 exactly; summing fares, fees and commissions in floats drifts by centavos and produces disputes.
- Integer arithmetic is exact and cheap. Percentages are applied in basis points with explicit half-away-from-zero rounding, so the rounding rule is written down once.

## Consequences

- Decimal input (for example admin-entered fare settings) is parsed from strings, never from floats.
- Formatting is a presentation concern and lives at the edges (`Money::format()` on the server, `formatMoney()` in the app).
