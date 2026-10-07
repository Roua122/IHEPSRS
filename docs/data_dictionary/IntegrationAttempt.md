# IntegrationAttempt — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| attemptId | UUID | Y | المعرف |  |
| messageId | FK | Y | الرسالة |  |
| attemptNo | Integer | Y | رقم المحاولة | UNIQUE(messageId,attemptNo) |
| startedAt | Timestamp | Y | البداية |  |
| endedAt | Timestamp | N | النهاية |  |
| outcome | Enum | Y | Succeeded/TransientFail/PermanentFail/SecurityFail |  |
| errorCode | String | N | الخطأ |  |
| workerId | String | N | معالج العملية |  |
| durationMs | Integer | N | المدة |  |
