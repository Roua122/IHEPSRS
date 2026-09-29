# AffiliationHistory — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| affiliationId | UUID | Y | المعرف |  |
| personId | FK | Y | الشخص |  |
| institutionId | FK | Y | المؤسسة |  |
| orgUnitId | FK | N | الوحدة |  |
| role/rank | String | N | الصفة/الرتبة |  |
| effectiveFrom | Date | Y | البداية |  |
| effectiveTo | Date | N | النهاية |  |
| sourceSystem | String | Y | المصدر |  |
