# IHEPSRS — Academic Prototype Task Closure Interpretation

**Status:** PROPOSED assessment rubric (derived from the repository baseline, not a Change Request, not itself an approval).  
**Date:** 2026-10-11  
**Scope:** TASK-HRD-001 (رؤى محمد), TASK-TH-005/006/007/008 (دعاء عبد الواحد).

## 1. Authoritative references, in precedence order

1. `docs/21_prototype_scope.md` — classifies `IMPLEMENT`, `MOCK`, `DOCUMENTATION_ONLY`, and `FUTURE` for the academic demonstration. **It does not alter full-system requirements.**
2. `docs/25_prototype_acceptance.md` — 17 global *prototype demo* gates (all require verification before claiming the entire prototype ready).
3. `docs/19_testing.md` — AC-01–AC-10, FR/BR/NFR test traceability, acceptance expectations.
4. `docs/27_developer_task_matrix.md` — all five tasks here are `IMPLEMENT`, priority `MUST`; requirements cannot be silently reclassified.
5. `phases/phase-05-thesis/tasks/TASK-TH-005.md` through `TASK-TH-008.md`, and `phases/phase-10-hardening/tasks/TASK-HRD-001.md` — original Definition of Done.
6. `docs/28_design_boundaries.md` — source of truth, core rules, fundamental authorization, idempotency and Must acceptance cannot be changed without the prescribed CR/ADR.

## 2. Two distinct approvals

- **Task closure (`DONE — Academic Prototype`):** verify all original task DoD bullets in the **per-task matrix**, pass reproducible tests and peer review, attach the evidence, and obtain an explicit acceptance decision for any mock/exception. Approval is specific to the academic scope.
- **Whole-prototype demo ready:** *separately* confirm every applicable item in `docs/25_prototype_acceptance.md` with an end-to-end demo and no direct manual database modification. Closing the five tasks by itself cannot satisfy the integration, dashboard or reporting gates owned by other team members.

## 3. Evidence standard

For each Must task, record:

1. Commit SHA / PR link and source requirement IDs (`FR-`, `BR-`, `NFR-`, `UC-`).
2. Positive and negative checks of business-state rules, authorization, institution scope, identity binding and audit; include actual **command, exit status, CI URL, and date**, not just a test-count claim.
3. Actual API/use-case proof covering the relevant flows, including rejection of forbidden transitions and cross-institution attempts; screenshots or sanitized request/response logs with correlation IDs are acceptable.
4. Integration proof using a trusted provider or **documented prototype MOCK**. Never trust `eligible=true`, `scan=clean`, supervisor identity or decision authority supplied by a client.
5. ADR approval for design decisions, documented scope exclusions and owner approval for any **exception**. A mock is not automatically an exception for missing fundamental business rules.
6. Documentation, no committed secrets, passing PR CI, reviewer sign-off.

### Allowed within the academic prototype

- An explicitly trusted institutional adapter/MOCK for external examiner eligibility, SIS, documents or requirements **if** approved by the appropriate academic/security owner and demonstrated through real application boundaries.
- Architecture/design/runbooks in place of full production infrastructure **only** where `docs/21_prototype_scope.md` or a formally approved scope/exception supports it.
- A session-local prototype state for a controlled demo may be recorded as a limitation, **not** mislabeled as durable ACID/WORM/encryption-at-rest or legally retained evidence.

### Not allowed even for the demo

- Replacing mandatory `IMPLEMENT` workflows with screenshots-only, disabling checks to pass tests, treating test-only stubs as production integrations, forging authorization from request bodies, weakening FR/BR/NFR Must rules without formal acceptance, or treating `Thesis Approved` as `DegreeDecision`.

## 4. Status language

- `IMPLEMENTED / LOCAL VERIFIED` — code and local focused checks only.
- `CI VERIFIED` — the named exact SHA passed configured CI (not necessarily all acceptance cases).
- `ACCEPTANCE REVIEW` — integration/API/demo artifacts and decision owner review pending.
- `DONE — ACADEMIC PROTOTYPE` — every required task criterion and approved boundary is signed; do not describe as production-certified.
- `BLOCKED` — required dependency/owner/ADR unavailable.

**Rule:** no `DONE` label or DoD checkbox is changed by the assessment alone. The actual task file is updated **after** acceptance and evidence review.

## 5. Shared closure conditions

- `TH005`: committee eligibility + known COI check + fully approved committee + genuinely submitted thesis + scheduling, with a documented trusted MOCK boundary for internal examiners.
- `TH006`: schedule, minutes/outcome and history; all `Pass`, `PassWithCorrections`, `ReDefense`, `Fail` state behaviors; exception authority and immutable prior sessions.
- `TH007`: mandatory corrections, authenticated verifier, attempted correction history; deny final approval until all mandatory corrections verified; a trusted evidence boundary or explicitly approved mock for attachments.
- `TH008`: authorized thesis approval, immutable final version and archival/as-of history, denial of direct mutation; demonstrate that awarding a degree is *separate*, with PG005 readiness and holds evidence, not falsely granted.
- `HRD001`: security verification must cover the source-listed controls or explicitly document approved academic-only infrastructure exclusions. IAM tests alone do **not** prove the integration-source control `BR-060/NFR-032`, production KMS/TLS/DAST or a real secrets scan.

## 6. Sign-off

Task owner: ___________________________   Date: __________
Peer reviewer: ________________________   Date: __________
Academic authority / ADR reviewer: ______   Date: __________
Security reviewer (HRD001): ___________   Date: __________

Record task-by-task decisions and links in `docs/51_roa_duaa_closure_assessment.md`. This document is an evidence interpretation, not a substitute for those approvals.
