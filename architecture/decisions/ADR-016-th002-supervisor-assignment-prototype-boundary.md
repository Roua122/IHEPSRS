# ADR-016 — TH-002 Supervisor Assignment Prototype Boundary

Status: Accepted for Academic Prototype

## Context

TASK-TH-002 must enforce FR-014, BR-011, BR-012, BR-043, BR-044 and NFR-014 before the full TH-001/TH-003 Thesis entity/state implementation is available. The baseline owns the canonical `ThesisSupervisorAssignment` fields, while TH-001 remains the owner of the canonical Thesis entity and lifecycle.

## Decision

1. TH-002 introduces `ThesisSupervisionContextService` as a **temporary integration adapter**, not a new Thesis source of truth. It carries only `thesisId`, `institutionId`, `programId`, and `studentPersonId` needed by supervision rules. TH-001 may register/replace this adapter later.
2. Supervisor assignments preserve the canonical baseline fields: `assignmentId`, `thesisId`, `researcherId`, `role`, `startDate`, `endDate`, `status`, `approvedByUserId`, `changeReason`, and optional `approvalDecisionId`.
3. Date windows use half-open effective intervals `[startDate, endDate)`. This allows a previous MAIN assignment to end on the same date its approved replacement starts, satisfying `endDate >= startDate` without overlap.
4. PGO may inspect supervision/eligibility; final assignment/end approval is restricted to PGA within the Thesis institution scope. `approvedByUserId` must equal the authenticated approving actor and is never trusted as a free request-body identity.
5. BR-044 uses baseline weights `MAIN=1.0`, `CO_SUPERVISOR=0.5`, and default limit `5`. The technical PolicyConfiguration key is `THESIS_SUPERVISORY_LOAD_LIMIT`. A Program-scoped policy is preferred, then a Central `GLOBAL` policy. A policy value may be a positive number or `{ defaultLimitPoints, rankLimits }`. `roleRank` is resolved from effective Researcher affiliation history; no new canonical Researcher rank field is introduced.
6. The policy version/limit used at assignment time is retained in an internal prototype decision snapshot. Later policy versions affect new decisions only and do not rewrite earlier assignments.
7. BR-011 is exposed as `assertReadyForInProgress()` so the TH-001/TH-003 state owner can enforce the guard on `ProposalApproved -> InProgress` without TH-002 owning Thesis state transitions.
8. Multi-record changes use in-memory rollback plus the shared prototype audit chain. This demonstrates NFR-014 for the Academic Prototype; durable database transactions/WORM audit remain deployment work.

## Consequences

- TH-002 can be verified independently without inventing Thesis lifecycle ownership.
- TH-001/TH-003 must call the BR-011 readiness hook when their state transition implementation is merged.
- No production persistence or enterprise approval workflow is claimed by this ADR.
