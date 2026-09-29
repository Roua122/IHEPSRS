# AcademicProgram — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| programId | UUID | Y | معرف البرنامج |  |
| institutionId | FK | Y | المؤسسة |  |
| orgUnitId | FK | Y | القسم/الوحدة |  |
| degreeLevel | Enum | Y | Diploma/Master/PhD |  |
| nameAr | String(250) | Y | اسم البرنامج |  |
| specializationCode | Ref | N | التخصص |  |
| status | Enum | Y | Active/Inactive |  |
| effectiveFrom | Date | Y | بداية السريان |  |
| effectiveTo | Date | N | نهاية الفعالية | NULL = مستمر؛ يجب ≥ effectiveFrom |
| thesisRequired | Boolean | Y | هل يتطلب البرنامج رسالة | يحدد مسار الدرجة/متطلبات Thesis |
| versionNo | Integer | Y | نسخة المرجع | يزداد عند تغيير جوهري |
