# TH-002 Supervisor Assignment — Implementation Review

## Scope

This implementation corrects and completes TASK-TH-002 against FR-014, BR-011, BR-012, BR-043, BR-044, UC-06 and NFR-014.

## Implemented behavior

- Runtime DTO validation for supervisor assignment, end-assignment and eligibility requests.
- IAM-003 decision service used for institution-scoped supervision authorization.
- PGO can inspect candidates/history; PGA approves final assignment/change.
- `approvedByUserId` is bound to the authenticated approving principal.
- Researcher must be Active and cannot be the Thesis student's Person.
- MAIN and CO weights are 1.0 and 0.5; default maximum is 5 points.
- Program/rank-specific limits resolve from versioned/effective-dated `PolicyConfiguration` without retroactive rewriting.
- Exactly one effective MAIN interval is maintained; MAIN changes close the prior record and create a new record.
- Supervisor history is preserved instead of overwritten.
- `endDate >= startDate` is enforced; effective windows use `[startDate, endDate)`.
- BR-011 is exposed as a state-transition readiness guard for the TH-001/TH-003 owner.
- Multi-record changes roll back assignment and audit state together in the in-memory Academic Prototype.
- Correlation-aware hash-chain audit events are created for sensitive supervision changes.

## Ownership boundary

TH-002 does **not** implement the canonical Thesis entity, Proposal workflow, Submission workflow, committee/defense lifecycle, or final degree approval. Those remain with TH-001/003/004 and TH-005..008 according to the approved team allocation. The temporary `ThesisSupervisionContextService` exists only to avoid fabricating those missing domain owners.

## Verification

Run:

```text
pnpm --filter @ihepsrs/api thesis:check
```

The check uses source IDs in test output, including TC-FR-014, TC-BR-011, TC-BR-012, TC-BR-043, TC-BR-044, TC-NFR-008-TH002, TC-NFR-014 and TC-NFR-011-TH002.
