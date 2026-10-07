# INT-09 — Curated Data Feed

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-09 | Analytics ← IHEPSRS | Curated Data Feed | ETL/CDC | De-identified/authorized dataset | record key+version | Restartable batch; checkpointing | Nightly |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
