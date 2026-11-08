# ADR 0001: One repository with `backend/` and `app/`

Date: 2026-11-02 · Status: accepted

## Decision

Keep the Laravel API and the Expo app in one Git repository, as sibling folders `backend/` and `app/`.

## Why

- The API contract (envelope shape, Zod schemas, route names) changes together with the screens that use it. One pull request can change both sides and CI verifies them together.
- One place for conventions (`CLAUDE.md`), docs and ADRs.
- The two halves still have independent toolchains (Composer vs npm), so nothing is shared at build time. Git hooks at the root only route staged files to the right formatter.

## Consequences

- CI runs two independent jobs so a frontend-only change still runs the backend suite. Path filters can be added later if runtime becomes a problem.
