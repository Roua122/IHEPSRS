# DefenseSession — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| defenseId | UUID | Y | المعرف |  |
| thesisId | FK | Y | الرسالة |  |
| scheduledAt | DateTime | Y | موعد الجلسة |  |
| location | String | N | المكان/الرابط |  |
| result | Enum | N | النتيجة | BR-017 |
| minutesDocumentId | FK | N | المحضر |  |
| completedAt | DateTime | N | الانتهاء |  |
