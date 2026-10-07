# CI / Test Baseline — TASK-FND-005

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: SHOULD

## Pull Request gate

```text
Install
  ↓
Format Check
  ↓
Typecheck
  ↓
Build
  ↓
Configuration Check
  ↓
Runtime Smoke Test
```

## Local verification

```powershell
pnpm install
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm config:check
pnpm test:smoke
```

## Smoke ports

The smoke runner deliberately uses separate ports:

```text
Central API:      3300
Mock University:  3400
```

This reduces collision with normal local development on 3000/3100.

## Current assertions

| Area | Assertion |
|---|---|
| Central API | health returns 200 |
| Config | safe status endpoint returns 200 |
| Secrets | config response does not expose secrets |
| Error model | missing route returns `NOT_FOUND` |
| Error safety | client response has no stack |
| Correlation | supplied ID is preserved |
| Correlation | missing ID is generated |
| Mock SIS | health returns 200 |
| Mock SIS | students endpoint returns seed data |

## Database boundary

The current Foundation does not query PostgreSQL during these smoke assertions.
The test runner supplies a dummy `DATABASE_URL` only to satisfy startup validation.

When persistence is implemented, CI must be extended with PostgreSQL,
migration verification, and database-aware tests.
