# INT-05 — Funding status/reference only; no payments

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-05 | Finance → IHEPSRS (read reference) | Funding status/reference only; no payments | API/Batch | projectRef/funding summary | externalFinanceRef | Manual reconciliation for permanent mismatch | Daily / on demand |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
