# ThesisProgress — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| progressId | UUID | Y | المعرف |  |
| thesisId | FK | Y | الرسالة |  |
| periodFrom | Date | Y | بداية الفترة |  |
| periodTo | Date | Y | نهاية الفترة |  |
| studentSummary | Text | N | ملخص الطالب |  |
| supervisorAssessment | Text | N | تقييم المشرف |  |
| rating | Enum | N | التقييم |  |
