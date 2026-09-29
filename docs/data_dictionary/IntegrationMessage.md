# IntegrationMessage — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| messageId | UUID | Y | المعرف الداخلي |  |
| sourceSystem | String | Y | المصدر |  |
| externalId | String | Y | معرف الرسالة/الكيان | جزء من idempotency |
| messageType | String | Y | النوع |  |
| correlationId | String | Y | التتبع |  |
| status | Enum | Y | الحالة | State model |
| receivedAt | DateTime | Y | الاستلام | UTC |
| retryCount | Integer | Y | المحاولات | >=0 |
| lastErrorCode | String | N | رمز الخطأ | بدون بيانات حساسة |
| eventTime | Timestamp | Y | وقت الحدث في المصدر |  |
| schemaVersion | String | Y | نسخة schema | مثال 1.0 |
| payloadOriginalRef | URI/BlobRef | Y | مرجع payload الأصلي المشفر | لا يكتب في logs |
| payloadHash | String | Y | Hash payload | Integrity/dedup evidence |
| processedAt | Timestamp | N | وقت نهاية المعالجة |  |
| sourceSequence | String/Long | N | نسخة/sequence المصدر | لـstale handling |
