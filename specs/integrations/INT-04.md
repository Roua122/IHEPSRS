# INT-04 — Notification Delivery

Source: Analysis Baseline — Section 13.2.

| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-04 | IHEPSRS → Email/SMS | Notification Delivery | Async event | Template + recipient + minimal variables | notificationId | Retry 3; status Failed; no business transaction rollback | Near real-time |

## Shared Contract
راجع:
- `docs/16_integration.md`
- `docs/13_business_rules.md`
- `docs/17_security.md`
