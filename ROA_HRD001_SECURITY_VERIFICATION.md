# TASK-HRD-001 — Security verification (رؤى محمد)

Status: **PARTIAL — focused regression evidence only; do NOT mark DONE**.
Source IDs: FR-003, FR-037, BR-027, BR-028, BR-060, NFR-008–011, NFR-025–034, NFR-036.

## Evidence in this change

- `pnpm --filter @ihepsrs/api hardening-security:check`: focused in-process cases using the **real** Institution/Academic authorization services, identity role decision engine, hashed audit-chain, local credential policy and login attempt tracker.
- `pnpm --filter @ihepsrs/api iam001:check` through `iam005:check`: existing identity, delegation, MFA and session tests in CI. Run and retain their build logs.
- `pnpm --filter @ihepsrs/api thesis-defense:check`: new TH005–008 tests for scope, authority boundaries, fail-closed eligibility, audit failure, immutable outcome history.
- `git diff --check`, `pnpm quality`, dependency audit and repository secret scanning must be run in CI/on a dependency-equipped machine.

## Security verification matrix

| Control | Verification state | Remaining work |
| --- | --- | --- |
| FR-003/BR-027/NFR-008 RBAC/institution scope | **Focused tested** | End-to-end API & program-scope coverage; negative integration system tests |
| BR-028 delegation | **Existing IAM004 coverage** | Collect formal review evidence |
| FR-037/NFR-011 sensitive Audit hash chaining | **Focused tested** | Durable WORM/tamper-evident external storage; sensitive reads; 7-year retention policy |
| NFR-009/030/031 MFA, sessions, local fallback | **Existing IAM005 coverage + partial focused** | Browser/session deployment checks, SSO failover audit |
| BR-060/NFR-032 integration source identity & replay | **NOT VERIFIED** | mTLS/OAuth2 client credentials, 5m replay gate, rate limits, cross-institution SecurityEvent |
| NFR-010/027 secrets and rotation | **NOT VERIFIED** | KMS/secret store, 90-day rotation and revocation evidence |
| NFR-025/026 privacy/encryption | **NOT VERIFIED** | Data classification, encrypted storage/backups, key separation, log masking |
| NFR-028/029 API/web & file defenses | **Partially fail-closed** | DAST/XSS/CSRF/SSRF/path traversal tests; real malware scanning and quarantine |
| NFR-033 incident response | **NOT VERIFIED** | Incident owner, severity routing, alerting, timeline and postmortem drill |
| NFR-034 security scans | **NOT VERIFIED** | SAST/dependency scan per build, DAST before release, penetration test |
| NFR-036 operational monitoring | **PARTIAL** | Queue/freshness/storage/rate/error metrics and log-class separation |

## Acceptance restriction

Hash-chain tests are not production WORM proof. Map-backed academic records are not a durable transactional store and do not provide encryption-at-rest, multi-instance safety, 7-year retention or real SIEM integration. The prototype must not be called production hardened. Close HRD001 only after an independent security review and recorded verification of required deployment-level controls.

## New executable controls (2026-10-11 increment)

- `check-defense-eligibility.cjs` asserts PGA scope, canonical Researcher status/institution, signed institutional eligibility, no known Research conflict, and rejects identifier/role/Thesis replay. 23 cases together with read-audit verification.
- Defense committee, session and correction read operations now append event names and actor identity to the academic hash-chain before exposing records; sensitive evidence text is not included in those audit entries.
- `.github/workflows/security-scans.yml` adds **CodeQL JS/TS SAST** and `pnpm audit --audit-level high` on pull requests, pushes to main and weekly scans. **A configured workflow file is not evidence of a passing remote scan**; capture run URLs and address findings before release.

## Required third-party/deployment artifacts to close HRD001

| Source | Required objective proof (not available in this repo) |
| --- | --- |
| NFR-008/009/030 | HTTPS 1.2+ test, MFA/SSO actual deployment, revocation and idle-timeout acceptance |
| BR-060/NFR-032 | Authenticated integration service scope/replay/security-event E2E; external integration team's connector |
| NFR-010/027 | KMS/Secrets Manager configuration, owner, 90-day credential rotation and revocation evidence |
| NFR-011/025/026 | Immutable audit retention, sensitive-read E2E, encrypted database/object/backups, separated keys |
| NFR-028/029 | DAST/penetration report, file magic/size/checksum, scanner/quarantine and unsafe download block |
| NFR-033/034/036 | Incident drill, CodeQL+dependency scan runs, authorized penetration test, live latency/error/queue metrics |

Status remains **PARTIAL** until links/evidence for the above controls are reviewed and signed by the security owner. No amount of passing in-memory unit checks attests production encryption or SIEM controls.
