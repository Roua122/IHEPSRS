# OrgUnit — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| orgUnitId | UUID | Y | معرف الوحدة |  |
| institutionId | FK | Y | المؤسسة |  |
| parentOrgUnitId | FK | N | الوحدة الأب | لا دوائر |
| type | Enum | Y | College/Department/... |  |
| nameAr | String(250) | Y | الاسم |  |
| status | Enum | Y | الحالة |  |
| effectiveFrom | Date | Y | بداية الفعالية |  |
| effectiveTo | Date | N | نهاية الفعالية | NULL=مستمر |
