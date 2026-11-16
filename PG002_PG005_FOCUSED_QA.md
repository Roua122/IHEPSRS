# PG002–PG005 focused QA — 2026-10-11

## Scope

This change is based on the Stage 7 `IHEPSRS_stage7_fixed.zip` snapshot.
It strengthens `TASK-PG-002`, `TASK-PG-003`, `TASK-PG-004`, and
`TASK-PG-005` without claiming their final Definition of Done.

## Code corrections

1. **FR-011 / BR-041 — stale reviewer evidence:** all review events now carry
   `submissionSnapshotId`. A formal decision requires that the assigned
   reviewer's non-final review belongs to the **latest** immutable submitted
   iteration, not merely the same application or reviewer after resubmission.
2. **FR-010 / FR-013 / NFR-025 — scoped staff read:** an authorized PGO/PGA
   may access the record even if that staff account has not been registered as
   a canonical applicant Person. An unrelated user cannot bypass program and
   institution scopes via the fallback; missing Person aliases are treated as
   non-owner, not as proof of ownership.
3. **FR-043 / BR-062 / NFR-014 — audit-failure safety:** policy approval
   stages copied versions, verifies audit recording, and only then swaps the
   in-memory policy map. Failed audit must not shorten an earlier approved
   version's effective window. This is a prototype-local safeguard only and
   is **not** a replacement for DB transactions.

## Run on Windows PowerShell from repository root

```powershell
pnpm install --frozen-lockfile
pnpm exec prettier --write apps/api/scripts/check-pg-workflows.cjs apps/api/src/postgraduate/domain/academic.types.ts apps/api/src/postgraduate/domain/application-workflow.service.ts apps/api/src/postgraduate/domain/enrollment-lifecycle.service.ts apps/api/src/postgraduate/domain/enrollment-policy.service.ts
pnpm --filter @ihepsrs/api pg-institutions:check
pnpm --filter @ihepsrs/api pg-workflows:check
pnpm quality
```

`pg-workflows:check` builds NestJS before running the focused compiled-service
suite, and CI invokes it after the PG/Institutions Stage 7 gate.

## Verification result in author's offline environment

- **21/21** focused domain checks passed using a TypeScript **transpile-only**
  runner and a minimal Nest decorator stub. This was NOT the official `pnpm`
  build, Prettier or typecheck and must not be reported as such.
- Application/Person/cycle scoping; immutable submission and staged documents;
  review/NeedMoreInfo; conditional admission; SIS-mapped Enrollment;
  policy authorization, versioning and audit rollback; lifecycle operations,
  status history and fail-closed degree readiness were exercised.
- One isolated positive resubmission case uses a **test-only** trusted-document
  double; the production `UnavailableApplicationDocumentGateway` remains
  fail-closed. It does not demonstrate live file scans or DocumentLink storage.

## Still blocking task closure

- FR-029/NFR-022/NFR-029/BR-057: trusted Document + DocumentLink service,
  upload validation and malware scanning (not present).
- FR-030: durable notification delivery, retry and receipt handling.
- FR-043/BR-062: team-approved central policy registry and ADR approval.
- FR-013/BR-054: live trusted SIS, ProgramRequirements, Thesis, Holds and
  degree readiness evidence (the current gateway deliberately fails closed).
- NFR-014: durable database repositories, multi-entity atomic transactions,
  unique active enrollment constraint and shared audit/outbox.
- UC-06/BR-053: approved program-change/transfer interface and remaining
  integration acceptance, HTTP E2E and security/regression checks.

Until these are integrated, PG002/003/004/005 remain **WIP / integration pending**.
