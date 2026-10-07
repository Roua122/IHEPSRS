# Thesis — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| thesisId | UUID | Y | المعرف |  |
| enrollmentId | FK | Y | القيد |  |
| titleAr | String(1000) | Y | العنوان العربي |  |
| titleEn | String(1000) | N | العنوان الإنجليزي |  |
| abstract | Text | N | الملخص |  |
| status | Enum | Y | حالة الرسالة | State model |
| proposalApprovedAt | DateTime | N | اعتماد المقترح |  |
| submittedAt | DateTime | N | التقديم |  |
| approvedAt | DateTime | N | الاعتماد النهائي |  |
| orgUnitId | FK | Y | القسم/الوحدة الأكاديمية المالكة | ساري وقت التسجيل |
| currentVersionId | FK | N | النسخة الحالية | يشير ThesisVersion |
| reDefenseCount | Integer | Y | عدد إعادة المناقشة | default 0 |
| finalApprovedAt | Timestamp | N | وقت الاعتماد النهائي |  |
