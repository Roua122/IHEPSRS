# Student — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| studentId | UUID | Y | المعرف المركزي |  |
| personId | FK | Y | الشخص |  |
| sourceSystem | String | Y | النظام المصدر |  |
| externalStudentId | String | Y | معرف الطالب في المصدر | فريد مع sourceSystem |
| institutionId | FK | Y | المؤسسة |  |
| academicStatus | Enum | Y | الحالة الأكاديمية | المصدر SIS |
| lastSourceUpdateAt | DateTime | Y | وقت آخر تحديث مصدر |  |
| sourceVersion | String/Long | N | نسخة/sequence من SIS | يفضل عند توفره |
| (relationship) | — | — | حساب المستخدم | لا userId مكرر داخل Student؛ الربط Student.personId → UserAccount.personId، وقد يملك Person أكثر من حساب مؤسسي. |
