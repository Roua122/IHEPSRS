# ReportSnapshot — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| snapshotId | UUID | Y | المعرف |  |
| asOfTime | Timestamp | Y | نقطة الزمن | UTC |
| datasetVersion | String | Y | نسخة البيانات |  |
| kpiCode | String | Y | المؤشر |  |
| filterHash | String | Y | الفلاتر |  |
| value | Decimal/JSON | Y | القيمة |  |
| generatedAt | Timestamp | Y | وقت التوليد |  |
