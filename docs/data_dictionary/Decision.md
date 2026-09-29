# Decision — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| decisionId | UUID | Y | المعرف |  |
| entityType/entityId | String/UUID | Y | الموضوع |  |
| decisionType | String | Y | Admission/Thesis/Project/Amendment/Degree |  |
| outcome | String | Y | النتيجة |  |
| decidedByUserId | FK | Y | المعتمد |  |
| decidedAt | Timestamp | Y | الوقت |  |
| reason | Text | N | السبب | إلزامي للرفض/الاستثناء |
| policyVersionId | FK | N | السياسة المطبقة |  |
