# ProjectMember — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| projectMemberId | UUID | Y | المعرف |  |
| projectId | FK | Y | المشروع |  |
| researcherId | FK | Y | الباحث |  |
| role | String/Ref | Y | الدور |  |
| joinDate | Date | Y | الانضمام |  |
| leaveDate | Date | N | المغادرة |  |
