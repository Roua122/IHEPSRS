# AmendmentRequest — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| amendmentId | UUID | Y | المعرف |  |
| entityType/entityId | String/UUID | Y | السجل المستهدف |  |
| changeType | String | Y | Title/Supervisor/Budget/Leader/Duration/... |  |
| requestedByUserId | FK | Y | الطالب/الباحث/الإداري |  |
| reason | Text | Y | السبب |  |
| status | Enum | Y | Submitted/UnderReview/Approved/Rejected/Applied |  |
| decisionId | FK | N | القرار |  |
