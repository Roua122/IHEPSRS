# SupervisorAssignment — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| assignmentId | UUID | Y | المعرف |  |
| thesisId | FK | Y | الرسالة |  |
| researcherId | FK | Y | المشرف |  |
| role | Enum | Y | Main/Co-supervisor |  |
| startDate | Date | Y | البداية |  |
| endDate | Date | N | النهاية |  |
| status | Enum | Y | Active/Ended |  |
| approvedByUserId | FK | Y | من اعتمد التعيين/التغيير |  |
| changeReason | String(1000) | N | سبب التغيير | إلزامي إذا سبق مشرف فعال |
| approvalDecisionId | FK | N | قرار الاعتماد |  |
