# AdmissionCycle — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| admissionCycleId | UUID | Y | المعرف |  |
| programId | FK | Y | البرنامج |  |
| name | String | Y | اسم الدورة |  |
| applicationOpenAt | Timestamp | Y | فتح التقديم |  |
| applicationCloseAt | Timestamp | Y | الإغلاق | close>open |
| intakeStartDate | Date | Y | بدء الدراسة |  |
| status | Enum | Y | Planned/Open/Closed/Archived |  |
