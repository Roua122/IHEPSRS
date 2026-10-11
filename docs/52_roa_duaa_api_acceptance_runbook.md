# رؤى ودعاء — Prototype API Acceptance Runbook

**Purpose:** collect reproducible end-to-end evidence using the real NestJS route surface and trusted/test-environment adapters. **Not** a test result, credential recipe, or permission to bypass controls.

## Prerequisites

1. Fresh branch with the **merged PR #18** and the **new eligibility/security increment**. Both must be on the commit under test.
2. `pnpm install --frozen-lockfile`, `pnpm quality` and the checks in `scripts/verify-roa-duaa-prototype.ps1` all finish with exit code 0.
3. Real HTTP server started in a controlled test environment; authenticated test accounts with Student, PGO, PGA, Supervisor and out-of-scope roles. No real personal data in test fixtures, screenshots or logs.
4. A **trusted** thesis-submission DocumentLink/ProgramRequirements adapter (or an explicitly accepted in-test mock). A client-supplied file ID cannot assert scanner clearance; test must prove rejection before trusted validation.
5. Internal examiner Researcher/Person records with active status, known institution affiliation and documented PGA eligibility attestation. A known conflicting reviewer must be available as negative fixture.
6. An authorized decision/reviewer must record whether `ADR-017` is accepted for the academic prototype. Without that, positive committee approval is **not accepted** evidence.

## Recorded script: real HTTP journey

| Step | Actor | Actual endpoint/method where available | Required outcome/evidence |
| --- | --- | --- | --- |
| 0 | SIS/Applicant/PG staff | See `docs/22_demo_scenario.md` and PG controllers | Existing accepted enrollment, thesis and approved supervisor/proposal evidence. Do not manually force Thesis status. |
| 1 | Thesis owner/supervisor | `POST /theses/:thesisId/submission/versions`, then supervisor-confirm and `POST /theses/:thesisId/submission/submit` | Thesis reaches `Submitted` **through real TH004 operations** with trusted submission artifacts. |
| 2 | PGA | `POST /theses/:thesisId/defense/committee-member-attestations` (new increment) | Accept real internal Researcher with scoped PGA attestation; deny PGO, other institution, mismatched thesis and known COI. |
| 3 | Authorized proposer | `POST /theses/:thesisId/defense/committees` | Duplicate members, missing attestation, unknown person and role mismatch denied. Approved committee is not forged from request. |
| 4 | PGA | `POST /theses/:thesisId/defense/committees/:committeeId/approve` | Active trusted eligibility re-checked and committee approved. A newly added Research COI invalidates older attestation. |
| 5 | Authorized staff | `POST /theses/:thesisId/defense/sessions` | Reject before `Submitted`/approved committee; otherwise creates correctly dated session. |
| 6 | Authorized staff | `POST /theses/:thesisId/defense/sessions/:sessionId/minutes` | Authenticated meeting minutes accepted; evidence adapter/approved mock recorded and auditable. |
| 7 | Decision authority | `POST /theses/:thesisId/defense/sessions/:sessionId/outcome` | Enumerated `Pass`, `PassWithCorrections`, `ReDefense`, `Fail`; preserve original session history. |
| 8A | Authorized staff | `GET /theses/:thesisId/defense/corrections` | Conditional pass creates mandatory corrections; `POST .../approve` must fail while unresolved. |
| 8B | Authorized participants | `POST /theses/:thesisId/defense/corrections/:correctionId/submit`, then `.../verify` | Approval is gated on all mandatory verified corrections and correct authenticated verifier. Invalid files/claims fail closed. |
| 9 | PGA | `POST /theses/:thesisId/defense/approve` | Approved thesis gets immutable version/timestamp. Direct early approval, unverified corrections or unauthorized role denied. |
| 10 | Authorized staff | `POST /theses/:thesisId/defense/archive` + `GET /theses/:thesisId` | Final archive retains history; no direct edits or hard delete. |
| 11 | Independent degree authority | PG005 Enrollment/DegreeDecision APIs (verify endpoint from live controller) | Approved Thesis **alone** does not award degree; absent ProgramRequirements/holds evidence fails closed. |
| 12 | Security reviewer | Defense `GET .../committees`, `.../sessions`, `.../corrections` + audit service | Scoped sensitive reads and decisions appear with actor, outcome and correlation; other-institution access denied. |

**Source route** for defense: `apps/api/src/thesis/controllers/thesis-defense.controller.ts`. Path formats above are verified from the newer increment, but live deployment and access control must be verified; do not assume endpoint availability in older `main`.

## Mandatory negative scenarios (retain anonymized HTTP transcript)

- Missing session / unknown actor; PGO claiming PGA; reader from another institution; expired role or delegation.
- Attempts to submit before verified TH004 requirements, use a client-provided fake document or `scan=clean` flag, or accept a known COI examiner.
- Replay of an examiner attestation for another Thesis, program, role, or institution; reattest without resolving known conflict.
- Schedule before approved committee, minutes before scheduled date, duplicate member, and duplicate/stale defense outcome.
- `PassWithCorrections` followed by approval while one correction is Open/Rejected; verify actor spoofing denied.
- Second re-defense without PGA exception, archived-record mutation, and degree award without independent PG005 readiness.
- Audit write failure injection in a controlled test fixture must leave original academic state intact; no production fault injection without approval.

## Evidence record to store per case

- Test ID and requirement ID (`TC-FR-`, `TC-BR-`, `TC-NFR-`), environment, code SHA, time in UTC, actor role/scope (anonymized).
- Request method and route (no real access token or PII), **HTTP status**, expected/actual state, hash or ID of test fixture, correlation ID and safe audit event reference.
- PASS/FAIL/BLOCKED and reviewer signature. A screenshot alone without status and authorization context is insufficient.

## Non-functional and external proof

- `HRD001`: attach exact security scan runs (SAST/dep), secret scan, browser/API session & MFA checks, and incident tabletop/alert mock, plus ownership of the integration-source BR-060/NFR-032 controls.
- `TH006/007`: record the approved DocumentLink adapter/mock, scan/quarantine status and denied unverified attachment cases. String-only `minutes` and `evidenceNote` do not prove an immutable verified document.
- `TH008`: cite separate PG005 readiness contract evidence; do not call the Thesis approval itself a degree grant.
- External examiner verification, durable audit, real TLS/KMS/DR/SIEM and penetration testing are **not** demonstrated by this runbook. If outside academic scope, list the authorized classification/exception and its owner in the sign-off.

Use the decision sheet `docs/53_roa_duaa_acceptance_signoff.md` for final task disposition.
