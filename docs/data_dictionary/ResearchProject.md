# ResearchProject — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| projectId | UUID | Y | المعرف |  |
| proposalId | FK | N | المقترح الأصل |  |
| leaderId | FK | Y | القائد |  |
| institutionId | FK | Y | المؤسسة |  |
| title | String(1000) | Y | العنوان |  |
| startDate | Date | Y | البداية |  |
| endDate | Date | N | النهاية |  |
| status | Enum | Y | الحالة |  |
