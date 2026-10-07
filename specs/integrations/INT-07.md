# INT-07 — Publication Validation

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-07 | Repository/Index → IHEPSRS | Publication Validation | API | DOI/metadata | DOI | Timeout: remain SubmittedForValidation; validationStatus=Pending | On demand |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
