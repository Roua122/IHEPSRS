# Rahaf (رهف عادل) — Academic Prototype Verification Record

## Update after merged PR #23 — 2026-10-11

**Current reviewed main:** `175d20035eb3fd9b13816a1ab71a06314ff20fea`.
**Task disposition:** focused prototype checks passed; **0/8 tasks formally signed off**. This updated section supersedes the older "NOT RUN" entries and SHA below, which remain as historical evidence of the earlier snapshot.

### Merged work and verification

- Initial Rahaf implementation: [PR #16](https://github.com/Roua122/IHEPSRS/pull/16).
- PG001 test-to-CI integration: [PR #22](https://github.com/Roua122/IHEPSRS/pull/22), merged into `main`.
- TH003/TH004 focused test-to-CI integration: [PR #23](https://github.com/Roua122/IHEPSRS/pull/23), merged into `main`.
- [CI](https://github.com/Roua122/IHEPSRS/actions/runs/38168680187) and [Security scans](https://github.com/Roua122/IHEPSRS/actions/runs/38168680183) for merge SHA `175d200` are **completed successfully**; these are automated build/security-scan results, not proof of production integration readiness.

| User-executed local command | Verified local result | Interpretation |
| --- | --- | --- |
| `pnpm --filter @ihepsrs/api pg001:check` | PASS, 17 focused checks | Applicant/Person and trusted SIS model logic; no live upstream attestation |
| `pnpm --filter @ihepsrs/api pg-workflows:check` | PASS, 21 checks | PG002–PG005 domain rules with shared adapters/test doubles |
| `pnpm --filter @ihepsrs/api pg-institutions:check` | PASS, 7 checks | PG/institutions canonical scope and reference gates |
| `pnpm --filter @ihepsrs/api thesis:check` | PASS, TH002 owner checks plus 21 TH001↔TH002 integration checks | TH002 belongs to Duaa, not Rahaf; exercises a limited TH001 boundary |
| `pnpm --filter @ihepsrs/api rahaf-thesis:check` | PASS, 29 checks | TH003/TH004 proposal/submission gates using **test doubles only** |
| `pnpm --filter @ihepsrs/api thesis-defense:check` | PASS, 35 defense checks plus 23 eligibility checks | Supporting scenario includes Duaa's tasks; not Rahaf task-level sign-off |
| `pnpm quality` | PASS | Prettier, typechecks and builds for the tested local branch |

### Eight Rahaf-owned tasks: current review disposition

| Task | Confirmed prototype evidence | Remaining acceptance blocker |
| --- | --- | --- |
| PG001 | 17 focused checks and CI test step merged | HTTP/authenticated API scenarios, canonical SIS trust boundary, independent approval |
| PG002 | 21 shared workflow and 7 canonical registry checks | Trusted DocumentLink/scan service, notification delivery or formally approved mock boundary, durable transaction/outbox, API acceptance |
| PG003 | Staff review, NeedMoreInfo, resubmission invariants tested | HTTP scope/role tests, proposed conditional admission ADR decision, durable records/notifications |
| PG004 | Admission decision, immutable snapshot and enrollment handoff guards tested | ADR approval for conditional acceptance, HTTP negative-path acceptance, durable decision/audit |
| PG005 | Enrollment/extension/status history, policy gates and fail-closed degree decision tested | Canonical approved policy, verified degree-readiness source, BR053 program-change decision, transactional repository |
| TH001 | Draft/Registered, supervisor linkage, immutable versions and history exercised | Trusted DocumentLink, durable Thesis aggregate/audit, full scoped HTTP acceptance |
| TH003 | 29-case combined test covers proposal authorization, revisions, supervisor and committee approval | Real classified plan DocumentLink; HTTP acceptance; durable transactions |
| TH004 | 29-case combined test covers final document, supervisor confirmation and scoped programme evidence | Real final DocumentLink and ProgramRequirements integration, durable transaction, HTTP E2E |

### Do not overstate coverage

- The shared Document, Notification, SIS, and programme-requirements interfaces must not be substituted with browser-provided `scan=clean`, `requirementsMet=true`, or completion flags.
- Current process-memory maps, hash-chain prototype audit and test-double integrations are **not** evidence of production-grade durability, storage, malware scanning or enterprise service integration.
- No task should be marked DONE merely because tests passed. Keep owner/reviewer sign-off and any allowed prototype exclusions explicit; do not alter tasks owned by Khulood or Amah.
- The older evidence snapshot below is preserved for traceability, not treated as the current status.

---

### Historical verification snapshot (before PR #22 and PR #23)

**Date:** 2026-10-11  
**Repository:** `Roua122/IHEPSRS`  
**Reviewed main SHA:** `0fd3688b60f64937748005a5571bf29c5e87b029`  
**Original implementation PR:** https://github.com/Roua122/IHEPSRS/pull/16  
**Status:** EVIDENCE COLLECTION / NOT FORMALLY ACCEPTED

## Scope

Only Rahaf's eight `IMPLEMENT / MUST` tasks: `PG001–PG005` and `TH001`, `TH003`, `TH004`. Existing TH002 tests are referenced only to verify integration boundaries; TH002 is owned by another teammate. This evidence record does **not** implement or approve tasks assigned to خلود or أمة الرحمن.

## User-executed local checks — 2026-10-11

| Command | Reported result | What it establishes / caveat |
| --- | --- | --- |
| `pnpm --filter @ihepsrs/api pg-workflows:check` | **PASS — 21 checks** | Focused compiled-domain workflows for PG002–PG005, including reviewer authorization, NeedMoreInfo, pinned snapshots, admission decision gating, active enrollment, policy validation, and degree-readiness fail-closed behavior. Not a real HTTP/API acceptance run, live SIS, document scanning, or durable DB test. |
| `pnpm --filter @ihepsrs/api pg-institutions:check` | **PASS — 7 checks** | Canonical INS/PG institution/program reference integration, cross-institution mismatch and document fail-closed regressions. Not an end-to-end demo. |
| `pnpm --filter @ihepsrs/api thesis:check` | **PASS — TH002 supervision suite and 21 TH001↔TH002 checks** | Thesis Draft → Registered and MAIN supervisor assignment, trust binding and simulated atomic rollback. The standalone TH002 task is NOT attributed to Rahaf. Does not prove TH003/TH004 end-to-end document/requirements integration. |
| `node apps/api/scripts/check-pg001.cjs` | **NOT RUN in supplied local log** | Standalone PG001 focused suite exists in repository. Run it, record exact output and exit status; add to CI separately. |
| `pnpm --filter @ihepsrs/api thesis-defense:check` | **NOT RUN in supplied local log** | This suite includes a positive TH003/TH004 path with **test-only** DocumentLink and requirements adapters, plus TH005–TH008 owned by Duaa. It is not proof the default production DI adapters are ready. |

GitHub Actions at the reviewed `main` SHA:
- CI: https://github.com/Roua122/IHEPSRS/actions/runs/38161185600 — **success**.
- CodeQL + dependency audit: https://github.com/Roua122/IHEPSRS/actions/runs/38161185577 — **success**.

The CI workflow has *not* been confirmed to contain `PG001` standalone tests at this SHA. In particular, the presence of a script in the repository must not be reported as a passing test.

## Per-task disposition

| Task | Evidence | Remaining before task-level sign-off |
| --- | --- | --- |
| PG001 | Applicant/Person services and a dedicated `check-pg001.cjs` script exist | Run dedicated script, add CI gate, review real API and authenticated SIS identity ownership / data masking; secure independent sign-off. |
| PG002 | 21-case shared PG workflow suite and 7-case PG/INS coverage passed | Trusted DocumentLink/scan evidence, notification delivery or approved prototype boundary, API acceptance, persistence/transactional boundary decision. |
| PG003 | Focused review, reviewer scope and NeedMoreInfo cases passed | Real HTTP role/scope and timestamp evidence, ADR for conditional decision behavior, persistence/notification boundary acceptance. |
| PG004 | Admission evidence/conditional decision and handoff gates in shared suite passed | Approved conditional-admission decision, API rejection evidence and official reviewer acceptance. |
| PG005 | Enrollment, state history, effective policy, and degree denial tested | Approved canonical policy / ADR, degree readiness provider or approved prototype boundary, transactional persistence and real API tests. |
| TH001 | 21 TH001↔TH002 integration checks passed | Standalone thesis/version/as-of negative tests, real API acceptance, durable data and verified DocumentLink boundary. |
| TH003 | Covered indirectly in test-only defense journey, not a standalone acceptance proof | Authenticated proposal submit/review/return/approve HTTP positive and negative cases, classified verified plan document, approved mock/adapter. |
| TH004 | Covered indirectly in test-only defense journey, not a standalone acceptance proof | Trusted submission document and ProgramRequirements evidence; supervisor confirmation, submission + failures through real HTTP; transactional acceptance. |

## Mandatory restrictions

- Do not mark any of these eight task files `DONE` based on the focused tests alone.
- Do not change source-of-truth rules or trust request-body `scan=clean`, `requirementsMet=true`, or `degreeReady=true`.
- The current fail-closed Document/SubmissionRequirements/DegreeReadiness adapters correctly refuse unverifiable claims; never bypass them to make a demo pass.
- Production-grade multi-instance persistence, durable audit, WORM, scanner/KMS/DR and real upstream integrations are not demonstrated by these checks. Prototype exclusions require formal review where allowed by the documented scope.
- Do not edit team members' tasks outside Rahaf's scope. Cross-team dependencies are listed as blockers, not claimed as independently completed.

## Next evidence to collect

1. Run `pnpm --filter @ihepsrs/api pg001:check` **after** adding its script to `apps/api/package.json`, or run `node apps/api/scripts/check-pg001.cjs` after API build without that change.
2. Run `pnpm --filter @ihepsrs/api thesis-defense:check`; separate TH003/004 test-only fixture evidence from Duaa's TH005–TH008 scope.
3. Confirm `pnpm quality` and CI/security workflow results for **the new code SHA** after any test/CI patch.
4. Record negative HTTP cases and approved boundaries/ADRs. Attach sanitized responses/correlation IDs and reviewer/date before task DoD sign-off.

**Task owner:** __________________________  **Reviewer:** __________________________  **Date:** __________
