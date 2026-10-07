# INT-06 — Approved Thesis Metadata

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-06 | Library/Repository ← IHEPSRS | Approved Thesis Metadata | Event/API | Thesis metadata + document reference | thesisId+version | Retry; not blocking final approval if repository unavailable unless configured | ≤ 24h |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
