# INT-10 — External↔Canonical code mappings, not ownership transfer

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-10 | External Adapter ↔ Reference Mapping Service | External↔Canonical code mappings, not ownership transfer | API | Institution/program/reference codes | code+version | Version negotiation; reject incompatible contract | On change |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
