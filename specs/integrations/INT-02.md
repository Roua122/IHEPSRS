# INT-02 — Program/Enrollment Reference Sync

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-02 | University SIS → IHEPSRS | Program/Enrollment Reference Sync | Scheduled/API | External reference codes + mapping فقط؛ Central Registry يبقى owner | externalId + effectiveDate | Retry; reference mismatch quarantine | Daily or on change |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
