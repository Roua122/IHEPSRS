# Foundation Bootstrap — TASK-FND-001

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

## Goal
Create a reproducible repository foundation that all 7 team members can run locally.

## Deliverables
- [x] ADR-001 Technology Stack
- [x] ADR-002 Architecture Style
- [x] ADR-003 Monorepo Structure
- [x] pnpm workspace
- [x] `apps/web`
- [x] `apps/api`
- [x] `apps/mock-university`
- [x] `packages/contracts`
- [x] PostgreSQL local container
- [x] Health endpoints
- [x] Swagger bootstrap
- [x] CI skeleton
- [ ] Install dependencies and create lockfile on team machine
- [ ] Verify all apps start
- [ ] Commit `pnpm-lock.yaml`
- [ ] Open PR and obtain review

## Foundation Acceptance
A team member on a clean machine should be able to:
1. install Node/pnpm,
2. clone repository,
3. copy `.env.example` to `.env`,
4. start PostgreSQL,
5. run `pnpm install`,
6. run `pnpm dev`,
7. open Web, API health and Mock University health.

## Do Not Implement Yet
- Authentication logic.
- Database domain models.
- Postgraduate/Thesis workflows.
- Integration message processing.
- Full UI pages.

Those belong to later Tasks.
