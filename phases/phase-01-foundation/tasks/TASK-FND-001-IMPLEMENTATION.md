# TASK-FND-001 — Implementation Plan

Owner: رؤى محمد

## Branch
`feature/TASK-FND-001-project-foundation`

## Read first
- `architecture/decisions/ADR-001-technology-stack.md`
- `architecture/decisions/ADR-002-architecture-style.md`
- `architecture/decisions/ADR-003-monorepo-structure.md`
- `docs/31_foundation_bootstrap.md`
- Existing `TASK-FND-001.md`

## Steps
1. Apply Foundation Bootstrap v4.
2. Copy `.env.example` to `.env`.
3. Install Node 24 LTS and pnpm 12 if needed.
4. Run `pnpm install`.
5. Commit generated `pnpm-lock.yaml`.
6. Run `pnpm db:up`.
7. Run `pnpm typecheck`.
8. Run `pnpm build`.
9. Run `pnpm dev`.
10. Verify:
   - Web opens.
   - API `/api/health` returns OK.
   - Swagger opens.
   - Mock University `/health` returns OK.
   - Mock `/students` returns seed student.
11. Commit and Push.
12. Open PR to `main`.

## Definition of Done
- [ ] Clean clone can be set up from docs.
- [ ] Three apps start.
- [ ] PostgreSQL container becomes healthy.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] CI passes.
- [ ] No secrets committed.
- [ ] PR reviewed by another member.
