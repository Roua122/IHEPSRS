# AuditLog — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| auditId | UUID | Y | المعرف |  |
| actorUserId | FK | N | الفاعل | قد يكون System |
| action | String | Y | الإجراء |  |
| entityType | String | Y | النوع |  |
| entityId | String | N | السجل |  |
| eventTime | DateTime | Y | الوقت | UTC |
| correlationId | String | N | التتبع |  |
| oldValueHash/summary | String | N | القيمة السابقة بشكل آمن | حسب الحساسية |
| newValueHash/summary | String | N | الجديدة | حسب الحساسية |
| actorRole | String | N | الدور وقت العملية |  |
| institutionScopeId | FK | N | النطاق المؤسسي |  |
| outcome | Enum | Y | Success/Denied/Failed |  |
| reason | String | N | المبرر/سبب الرفض | إلزامي للاستثناءات |
| clientInfo | String | N | client/app/ip metadata | Masked/minimized |
| changedFields | JSON | N | قائمة الحقول المتغيرة مع قيم masked/مقننة حسب التصنيف | لا تخزن أسرارًا |
| delegationId | FK | N | التفويض المستخدم | إن وجد |
