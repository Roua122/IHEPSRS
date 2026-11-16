# Stage 7 — PG / Institutions focused integration verification

Status: **Focused checks passed in offline runtime harness; official build/CI pending.**
Do not mark PG002–PG005 or Phase 04 DONE on this evidence alone.

## Scope

- `AcademicReferenceService` reads canonical Program/Institution/OrgUnit state
  through `InstitutionsService`, rather than a second mutable program registry.
- A genuine `ApplicationWorkflowService` draft and submission preserve the
  canonical Institution ID and Program version.
- A Program ID cannot move between Institutions by creating a new version.
- Whitespace-padded Program/OrgUnit identifiers cannot bypass canonical
  uniqueness and overwrite existing records.
- Historical program versions and effective-date selection are preserved.
- Institution deactivation changes PG eligibility immediately.
- Unconfigured document requirements and cross-program AdmissionCycles reject
  requests instead of fabricating successful evidence.

## Fixed source

- `apps/api/src/institutions/institutions.service.ts`
- `apps/api/scripts/check-pg-institutions-integration.cjs` (new)
- `apps/api/package.json` and `.github/workflows/ci.yml` (check wiring)

## Official verification command

Requirements: repository Node/pnpm versions and installed dependencies.

```bash
pnpm install --frozen-lockfile
pnpm --filter @ihepsrs/api pg-institutions:check
pnpm --filter @ihepsrs/api institutions:check
pnpm --filter @ihepsrs/api thesis:check
pnpm quality
```

The new focused script prints `STAGE 7 FOCUSED PG <-> INSTITUTIONS
INTEGRATION PASSED` **only at the end after all seven checks succeed**. Any
thrown error produces a nonzero exit status. The test will also run during CI.

## Verification in the current workspace

The sandbox has Node v22.16.0, lacks `pnpm@12.8.1` and installed dependencies,
and cannot reach the npm registry. The official build and quality gate could
not be run here. For partial evidence only, TypeScript source files were
transpiled with the globally available TypeScript compiler and services were
loaded using a minimal NestJS runtime stub (no typechecking).

Results from that **non-official** harness:

- New PG / Institutions focused test: 7/7 PASS.
- Existing Institutions focused test: PASS.
- Existing PG001 focused checks: 17/17 PASS.
- Existing TH001 / TH002 supervisor integration test: PASS (21 checks).

These are *not* evidence of a complete `pnpm quality`, HTTP E2E, DB-backed
transaction or deployment. In particular, the currently hardcoded demo
AdmissionCycle and application-requirements fixture do not represent a
production shared registry.

## Remaining blockers

- Restore/reconcile the *original* failing Stage 7 test/log if it was created
  only locally. It was **not present** in the uploaded main-branch ZIP.
- Complete admission-cycle and requirements adapters for non-demo programs.
- Finish trusted document/scanner, notifications/outbox, DB/transaction and
  other PG/TH integrations listed in task files.
- Run the official quality gate and full CI on a machine with dependencies.
