# INT-01 — Student Upsert

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-01 | University SIS → IHEPSRS | Student Upsert | Event/API or scheduled batch | Student canonical payload | (sourceSystem,messageId)؛ Business key = externalStudentId | 202 after envelope persist; internal retries; stale/duplicate ignored; quarantine permanent | Student sync ≤ 5 min event mode / ≤ 24h batch |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
