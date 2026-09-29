# ThesisVersion — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| thesisVersionId | UUID | Y | معرف النسخة |  |
| thesisId | FK | Y | الرسالة |  |
| versionNo | Integer | Y | رقم متسلسل | UNIQUE(thesisId,versionNo) |
| versionType | Enum | Y | Proposal/Submission/Approved/Amendment |  |
| title | String(1000) | Y | عنوان النسخة | تاريخي |
| abstract | Text | N | الملخص | تاريخي |
| documentId | FK | N | ملف النسخة | عبر DocumentLink |
| createdByUserId | FK | Y | المنشئ |  |
| submittedAt | Timestamp | N | وقت التقديم |  |
| approvedAt | Timestamp | N | وقت الاعتماد |  |
