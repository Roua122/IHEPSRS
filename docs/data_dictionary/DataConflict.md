# DataConflict — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| conflictId | UUID | Y | المعرف |  |
| entityType/entityId | String/UUID | Y | السجل |  |
| fieldName | String | Y | الحقل |  |
| sourceA/sourceB | String | Y | المصادر |  |
| valueA/valueB | Masked JSON | N | القيم المقارنة | حسب التصنيف |
| status | Enum | Y | Open/Assigned/Resolved/Closed |  |
| ownerUserId | FK | N | Data Steward |  |
| resolution | String | N | القرار |  |
| resolvedAt | Timestamp | N | الوقت |  |
