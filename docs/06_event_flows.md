# Event / Message Flows

Source: Analysis Baseline — Sections 13.2–13.4.

## Canonical Message Types
| Message Type | Business Key | النتيجة |
| --- | --- | --- |
| StudentUpsert | sourceSystem+externalStudentId | Create/update synchronized Student fields. |
| StudentDeactivated | same | Update academicStatus; no hard delete. |
| StudentMerged | oldExternalId→newExternalId | Update ExternalIdMapping; preserve history. |
| ProgramReferenceUpsert | externalProgramCode | Update mapping proposal only; Central Registry owns canonical program. |
| EnrollmentReferenceUpsert | externalEnrollmentId | Reference/freshness update. |
| AffiliationUpsert | employeeExternalId | Append/close AffiliationHistory. |
| FundingStatusSnapshot | externalFinanceRef | Read-only funding reference. |
| ThesisMetadataPublished | thesisId+versionNo | Outbound repository metadata. |

## Integration Processing Flow
`Receive → Authenticate → Validate Contract → Map Canonical Model → Idempotency Check → Business Validation → Process → Audit → Acknowledge / Retry / Quarantine`

## Required envelope behavior
- `messageId` + `sourceSystem` provide Message Identity/idempotency boundary.
- `correlationId` follows the transaction across integration/business/audit logs.
- `eventTime`/source version is used for stale-event protection.
- Succeeded, DuplicateIgnored and StaleIgnored are distinct outcomes.
- Retry/Quarantine behavior follows the Integration Baseline.
