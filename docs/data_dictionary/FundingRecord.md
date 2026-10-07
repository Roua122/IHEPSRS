# FundingRecord — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| fundingId | UUID | Y | المعرف |  |
| projectId | FK | Y | المشروع |  |
| sourceName | String | Y | مصدر التمويل |  |
| amount | Decimal | N | المبلغ المرجعي |  |
| currency | Ref | N | العملة |  |
| externalFinanceRef | String | N | مرجع النظام المالي |  |
| currencyCode | String(3) | Y | عملة المبلغ | ISO 4217 code |
| funderId | FK/String | Y | الممول المرجعي | لا يستخدم نص حر وحده |
| versionNo | Integer | Y | نسخة التمويل |  |
