# ADR-003 — Monorepo and Repository Structure

Status: Accepted  
Date: 2026-10-01

## Decision
Use one GitHub Repository and one pnpm workspace.

```text
IHEPSRS/
├── apps/
│   ├── web/
│   ├── api/
│   └── mock-university/
├── packages/
│   └── contracts/
├── docs/
├── architecture/
├── ai/
├── phases/
└── specs/
```

## Rules
- One Task = one short-lived Git branch.
- Shared API/integration types go to `packages/contracts`.
- Domain business logic stays inside its backend module.
- No direct imports from one app into another app.
- Apps may depend on shared packages.
- Secrets never enter Git.
- Generated/build folders never become source-of-truth artifacts.

## Rationale
A monorepo keeps contracts, documentation and prototype applications synchronized while
remaining simple enough for the academic team.
