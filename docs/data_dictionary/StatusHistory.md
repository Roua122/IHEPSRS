# StatusHistory — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| statusHistoryId | UUID | Y | المعرف |  |
| entityType | String | Y | الكيان | Allowlist |
| entityId | UUID | Y | المعرف |  |
| fromStatus | String | N | السابق |  |
| toStatus | String | Y | الجديد |  |
| changedAt | Timestamp | Y | الوقت | UTC |
| changedByUserId | FK | N | الفاعل | System ممكن |
| reasonCode | String | N | السبب |  |
| correlationId | String | N | التتبع |  |
