# TH005–TH008 — defense integration evidence (دعاء عبد الواحد)

Status: **IMPLEMENTED in prototype code; focused domain acceptance passes locally, shared service integration pending. NOT DONE.**

## Scope

- TH005: `ThesisCommittee` proposal/approval with duplicate checks, named roles, trusted eligibility boundary; `Submitted -> DefenseScheduled` only with genuine TH004 trusted evidence and approved committee.
- TH006: `DefenseScheduled -> Defended`; minutes and exactly one of `Pass`, `PassWithCorrections`, `ReDefense`, `Fail`; historical sessions preserved; limited ReDefense with explicit PGA exception.
- TH007: mandatory corrections for conditional pass, submission/rejection/re-submission with retained attempts, approver drawn from authenticated principal, final approval gate until verified.
- TH008: authorized Thesis final approval, append-only Approved ThesisVersion, approval date, archive after Approved/Failed, no hard delete. **Does not call PG005 DegreeDecision.**

## Tests

`pnpm --filter @ihepsrs/api thesis-defense:check`

Focused checks (35, in test harness): TC-FR-016,018,019,020,037,040,045; TC-BR-015,016,017,018,019,026,027,046,047; TC-NFR-008,011,014. Tested a real `TH004.submitThesis` path using *explicitly trusted test-only DocumentLink, requirements and supervisor adapters*. No bypass was added to production.

Also rerun:

- `pnpm --filter @ihepsrs/api thesis:check`
- `pnpm --filter @ihepsrs/api pg-workflows:check`
- `pnpm --filter @ihepsrs/api pg-institutions:check`
- `pnpm quality`
- `git diff --check`

## Important unclosed items

1. Default `DefenseEligibilityGateway` fails closed; it must be replaced with a **trusted** committee member eligibility/conflict-of-interest service to approve committees. Client-supplied `members` alone are insufficient.
2. Defense minutes currently use a structured authenticated entry, **not** a verified immutable DocumentLink; wire the future Document registry/minutes/evidence and real scheduling/conflict service.
3. Persistence and audit are process-local Map/hash-chain prototypes, not NFR-014 ACID multi-instance transactions, WORM or persistent retention. Need a single shared transactional repository for Thesis + session + committee + corrections + audit.
4. TH008 Thesis Approved is **not** award of an academic degree. PG005 `DegreeDecision` still requires trusted ProgramRequirements, Holds, Enrollment and Thesis readiness evidence, and final degree awarding remains separate and fail-closed.
5. Record access/read audit, reporting as-of integration, security assessments, full API/UI/demo acceptance and independent review remain unverified.

Do not mark TH005–008 final DONE before mandatory dependencies, full CI and acceptance tests pass. This package is a focused, merge-reviewable prototype increment, not a production completion certificate.
