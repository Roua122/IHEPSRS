# Enrollment — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| enrollmentId | UUID | Y | معرف القيد |  |
| studentId | FK | Y | الطالب |  |
| programId | FK | Y | البرنامج |  |
| applicationId | FK | N | طلب القبول |  |
| startDate | Date | Y | بداية القيد |  |
| status | Enum | Y | حالة القيد |  |
| completionDate | Date | N | الإنهاء |  |
| academicYear | String(9) | Y | السنة/الفوج الأكاديمي | مثال 2026/2027 |
| intakeId | FK | N | دفعة/دورة القبول |  |
| policyVersionId | FK | Y | نسخة السياسة المطبقة | تاريخي |
