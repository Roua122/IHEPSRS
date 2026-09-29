# PolicyConfiguration — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| policyId | UUID | Y | المعرف |  |
| policyKey | String | Y | اسم السياسة |  |
| scopeType/scopeId | String/UUID | Y | Central/Institution/Program/Cohort |  |
| value | JSON/String | Y | القيمة | Schema per policyKey |
| versionNo | Integer | Y | النسخة |  |
| effectiveFrom | Timestamp | Y | البداية |  |
| effectiveTo | Timestamp | N | النهاية |  |
| approvedByUserId | FK | Y | المعتمد |  |
| status | Enum | Y | Draft/Approved/Retired |  |
