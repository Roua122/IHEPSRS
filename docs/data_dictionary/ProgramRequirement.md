# ProgramRequirement — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| requirementId | UUID | Y | المعرف |  |
| programId | FK | Y | البرنامج |  |
| requirementType | String | Y | Course/Credit/Exam/Thesis/Document |  |
| value | JSON/String | Y | المتطلب |  |
| effectiveFrom | Date | Y | البداية |  |
| effectiveTo | Date | N | النهاية |  |
| versionNo | Integer | Y | النسخة |  |
