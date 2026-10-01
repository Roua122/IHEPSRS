# ADR-001 — Technology Stack

Status: Accepted  
Date: 2026-10-01  
Decision Owner: Team Architecture

## Context
IHEPSRS Academic Prototype يحتاج Stack موحدًا لفريق من 7 أعضاء، يدعم:
- Arabic/English web UI.
- REST integration.
- Clear domain modules.
- PostgreSQL.
- Automated testing.
- OpenAPI.
- GitHub collaboration.
- تشغيل محلي بسيط على Windows.

## Decision

### Frontend
- React + TypeScript + Vite
- Material UI
- React Router
- TanStack Query
- React Hook Form + Zod when forms start
- i18next/react-i18next when localization content starts

### Backend
- NestJS + TypeScript
- REST + JSON
- OpenAPI/Swagger
- Prisma as ORM/data-access tooling after physical data design is approved

### Database
- PostgreSQL

### Authentication
- JWT Access + Refresh Token for the academic prototype.
- Password hashing: Argon2 when IAM implementation starts.
- Authorization remains Role + Scope + Permission + Record State.

### Testing
- Backend: Jest/Supertest in the testing task.
- Frontend: Vitest/React Testing Library.
- E2E: Playwright.

### Tooling
- Node.js LTS
- pnpm workspace
- Docker Compose for local infrastructure
- GitHub Actions
- Prettier / linting

## Consequences
- Frontend and Backend both use TypeScript, reducing context switching.
- The team shares one dependency/workspace model.
- The prototype stays technically realistic without requiring enterprise infrastructure.
- Technology details may change through ADR without changing Analysis semantics.

## Analysis Constraints Preserved
This ADR does not change:
- FR/BR/NFR/UC meaning.
- Source of Truth.
- State models.
- Security requirements.
- Integration idempotency semantics.
