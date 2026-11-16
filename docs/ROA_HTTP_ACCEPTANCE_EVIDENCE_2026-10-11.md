# IHEPSRS — Roa FND/IAM HTTP acceptance evidence (pre-sign-off)

- **Recorded date:** 2026-10-11 (Asia/Aden)
- **Owner:** رؤى محمد
- **Scope:** Academic prototype, TASK-FND-001–005, TASK-IAM-001/002/003/005, TASK-HRD-001
- **Assessment:** IMPLEMENTATION / LOCAL HTTP EVIDENCE — **NOT YET APPROVED / NOT DONE**

## Version and evidence provenance

- GitHub `main` checked on 2026-10-11: `8a2aa589c15a31bf06785fd7ee60543428eb6b7b`.
- [CI run 38169251584](https://github.com/Roua122/IHEPSRS/actions/runs/38169251584): `success`, same `main` SHA.
- [Security scans run 38169251569](https://github.com/Roua122/IHEPSRS/actions/runs/38169251569): `success`, same `main` SHA. A successful workflow is **not** by itself proof of every NFR, a complete secrets review, or production security approval.
- **Local code SHA tested:** 8a2aa589c15a31bf06785fd7ee60543428eb6b7b (operator-reported local tests, 2026-10-11; standalone scripts untracked).
- **Test environment:** Local NestJS API, `http://127.0.0.1:3000/api`. Test reports supplied by the operator in the project conversation, not independently observed by the reviewer on the operator's machine. No credentials or tokens recorded.
- The 3 standalone HTTP scripts were run from the project root and are not claimed to be in `main` or CI. They must be added to a controlled test location if reproducible CI execution is desired.

## Actual local results reported by the operator

| Test script or command | Result | Explicit evidence | Limit |
| --- | --- | --- | --- |
| `node .\check-roa-http-acceptance.cjs` | **PASS 6/6** | `200` health/config; correlation header; safe `404`; unauthenticated/forged-session `401` | Read-only/negative cases; does not prove positive auth, storage or integration identity |
| `node .\check-roa-authenticated-http.cjs` | **PASS 6/6** | MFA login `201`; session `200`; wrong MFA `401`; reauthentication `201`; logout `201`; revoked token `401` | One local fallback identity; not SSO, cross-tenant, or durable session proof |
| `pnpm --filter @ihepsrs/api iam003:check` | **PASS 12 domain checks** | Cross-institution denial, expired roles, data scopes, state restrictions, cross-scope reports and privacy cases | Compiled service checks; not HTTP or DB row security |
| `node .\check-roa-iam003-institution-http.cjs` | **PASS 6/6** | UA MFA login `201`, session `200`, own-unit/program read `200`, foreign-unit/program read `403` | Single scoped UA and synthetic institution identifiers; no seeded foreign institution or second user |
| **Total local checks** | **PASS 30/30** | **18 HTTP + 12 authorization-domain checks** | Counts are check cases across different scripts, not 30 independent business acceptance criteria |

## Task-by-task interpretation

| Task | Demonstrated evidence | Remaining review / acceptance gate | Decision |
| --- | --- | --- | --- |
| `TASK-FND-001` | API runs; public health/correlation HTTP; green CI build | Confirm repository conventions, architecture/requirement traceability, exact local SHA, peer review | REVIEW |
| `TASK-FND-002` | Public configuration endpoint exposed approved non-secret data in smoke check | Run config validation/negative cases, check policy versioning and verify secrets scan details | REVIEW |
| `TASK-FND-003` | Safe 404 response/correlation shown through real HTTP | Verify representative validation and 5xx mappings as applicable; peer review | REVIEW |
| `TASK-FND-004` | Correlation header and safe error model | Record correlated security/audit events from same request and integration boundary once available | REVIEW / DEPENDENCY |
| `TASK-FND-005` | Main CI and Security scans green for the pinned SHA | Confirm required coverage, traceability, scanner artifacts and operator local SHA | REVIEW |
| `TASK-IAM-001` | Login/session uses user-account/principal; module implementation exists | Test account status/lifecycle and identity binding at acceptance surface; peer review | REVIEW |
| `TASK-IAM-002` | Approved role catalogue module and authorization checks exist | Review role source catalogue and intentionally uncoded rows; role/permission review | REVIEW |
| `TASK-IAM-003` | 12 authorization-domain checks + 6 scoped UA HTTP checks | Two actual test users and seeded institution A/B records, positive and negative operations, audit record | STRONG LOCAL EVIDENCE / REVIEW |
| `TASK-IAM-005` | 6 authenticated HTTP cases, including valid MFA, invalid MFA, reauth and revoked session | Clock-based expiry/lockout cases, trusted SSO boundary and non-durable session disclosure; reviewer | STRONG LOCAL EVIDENCE / REVIEW |
| `TASK-HRD-001` | Green CI/security workflow plus IAM HTTP negative checks | Review actual SAST/SCA/secret scan artifacts, security event/incident evidence, NFR-032 integration-source proof owned with integration team, documented academic exclusions, security sign-off | BLOCKED ON EXTERNAL EVIDENCE / REVIEW |

## Required follow-up — evidence, not a rewrite

1. Capture checkout identity: `git rev-parse HEAD` and `git status --short`; note any locally modified code, configuration, or standalone test scripts. Do not paste secrets or `.env` values.
2. Run `pnpm quality` and `pnpm test:smoke` on the recorded checkout (or link to the exact CI job that executes them), preserving exit codes.
3. Obtain peer review for the FND items first, with a clear check against every original task's Definition of Done.
4. For IAM003, seed separate authorized institution A/B *test* records and test scoped login/read/denial. This is separate from the currently passing synthetic-ID checks.
5. For IAM005, attach expiry/lockout test evidence and accepted prototype local-auth/SSO boundary; do not expose passwords, TOTP secrets or bearer tokens.
6. For HRD001, request the integration team's NFR-032/BR-060 evidence without changing their code. Verify security workflow step artifacts and get security/reviewer sign-off; do not confuse a green run with production certification.
7. Keep task states as `TODO` and all DoD checkboxes unchanged until per-task evidence, peer review, and scope/exception approval are recorded. Prototype-wide demo gates in `docs/25_prototype_acceptance.md` are separate.

## Reviewer decision (to be filled by an authorized reviewer)

- **Local SHA:** ______________________________
- **Verified date / test environment:** ______________________________
- **Reviewer:** ______________________________
- **Task IDs accepted:** ______________________________
- **Task IDs needing more evidence:** ______________________________
- **Approved mock or scope exception references:** ______________________________
- **Decision / signature:** ______________________________
