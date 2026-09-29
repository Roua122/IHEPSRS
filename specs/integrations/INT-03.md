# INT-03 — Faculty/Researcher Affiliation Sync

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-03 | HR → IHEPSRS | Faculty/Researcher Affiliation Sync | Scheduled/API | Person/affiliation minimal fields | employeeExternalId | Retry; do not overwrite research-owned fields | Daily |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
