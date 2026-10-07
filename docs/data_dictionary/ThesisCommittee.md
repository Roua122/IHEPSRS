# ThesisCommittee — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| committeeId | UUID | Y | المعرف |  |
| thesisId | FK | Y | الرسالة |  |
| status | Enum | Y | Draft/Approved |  |
| approvedAt | DateTime | N | اعتماد اللجنة |  |
