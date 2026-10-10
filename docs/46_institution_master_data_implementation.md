# Institution master data — INS-001 to INS-004

This document records the academic-prototype implementation boundary for Maram's institution-domain tasks. The source of business semantics remains the approved analysis baseline and the individual task files.

## Implemented source requirements

### TASK-INS-001 — Institution registry
- Canonical Institution fields: `institutionId`, `code`, `nameAr`, optional `nameEn`, `type`, `status`, and `externalRefs`.
- `BR-001`: an archived `institutionId` is retained and cannot be reused.
- `BR-033`: master-data writes produce correlation-aware prototype audit entries.
- Central registry operations use the existing IAM authorization engine instead of local role-string checks.
- The prototype can add institutions without changing core domain code; adapter/credential provisioning remains an Integration-domain responsibility under the NFR-007 boundary recorded in ADR-015.

### TASK-INS-002 — Organizational units
- Canonical OrgUnit fields include institution/parent references, type, status, and effective dates.
- `BR-002`: child units are constrained to the same active institution and a valid parent/effective period.
- `BR-042`: historical effective windows are retained and are resolved by event date.

### TASK-INS-003 — Academic programs and PolicyConfiguration
- AcademicProgram records retain institution, org-unit, degree level, Arabic name, optional specialization, status, effective dates, thesis requirement, and version number.
- Program changes create a new version rather than rewriting the historical version.
- `BR-003`: enrollment eligibility is checked against the program version effective on the enrollment/event date.
- PolicyConfiguration supports Central/Institution/Program/Cohort scopes, `versionNo`, effective dates, approval identity, and Draft/Approved/Retired status.
- `BR-062`: policy versions remain historically resolvable; a new policy version is not retroactively applied to an earlier decision.

### TASK-INS-004 — Reference data/versioning
- Reference values are stored as version history, not as a single `code -> value` overwrite.
- `BR-038`: historical values remain available after a newer version is introduced.
- `BR-039`: used/reference history is not physically deleted; retirement affects future use.
- FR-038/FR-043 behavior is represented by versioned/effective configuration rather than source-code constants where the task assigns policy ownership.

## Prototype atomicity and audit
Writes that update multiple in-memory records take a prototype snapshot. If a later step fails, the domain state and prototype audit length are restored. This gives executable evidence for NFR-014 in the prototype. Production persistence must replace this mechanism with durable database transactions.

## Verification
`apps/api/scripts/check-institutions.cjs` contains source-linked checks for FR-004/005/006/007/043, BR-001/002/003/033/038/039/042/062, NFR-007/NFR-014, authorization scope, and audit-chain integrity. The CI workflow runs `institutions:check`.

## Out of scope / not overclaimed
This implementation does not claim production database durability, a production audit/WORM store, or Integration-domain adapter/credential implementation. Those are separate architecture/deployment concerns.
