# ADR-008 — CI and Testing Baseline

Status: Accepted  
Date: 2026-10-01  
Related Task: TASK-FND-005

## Context

The repository now contains multiple runnable applications and shared contracts.
Each Pull Request needs a repeatable minimum gate before domain implementation expands.

## Decision

Every Pull Request must pass:

1. deterministic dependency installation from the committed lockfile,
2. Prettier verification for source/config files,
3. TypeScript checking,
4. production build,
5. configuration validation,
6. runtime smoke verification of the current Foundation behavior.

## Current smoke scope

The smoke suite verifies:

- Central API starts.
- `/api/health` returns successfully.
- `/api/config/status` exposes safe metadata.
- the common 404 error envelope works.
- supplied correlation IDs are preserved.
- correlation IDs are generated when absent.
- Mock University starts.
- Mock University returns seed students.

## Testing evolution

This task establishes the CI gate and an executable baseline.

As real domain logic is implemented, domain-level unit/API/component/end-to-end tests
will be added with those modules and included in the same gate.

## Consequence

The team gets an early regression barrier without pretending that unimplemented
business domains already have meaningful automated coverage.
