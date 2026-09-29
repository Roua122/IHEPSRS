# Integration Developer Reference

## ثابت من التحليل
التكامل يجب أن يدعم:
- Message identity
- Business identity
- Idempotency
- Schema version
- Correlation ID
- Stale message handling
- Retry
- Failed Permanent
- Quarantine
- Reprocess / Close
- Source system scope validation
- Audit / observability

العقد التفصيلي لكل Integration يوضع في `specs/integrations/`.
