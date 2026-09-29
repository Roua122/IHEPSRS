# DocumentLink — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| documentLinkId | UUID | Y | المعرف |  |
| documentId | FK | Y | الوثيقة | FK حقيقي |
| targetType | Enum | Y | نوع الكيان الهدف | Allowlist فقط |
| targetId | UUID | Y | معرف الهدف | يتحقق Document Service عبر Domain Adapter |
| purpose | String | Y | نوع المرفق |  |
| createdAt | Timestamp | Y | وقت الربط |  |
| createdByUserId | FK | Y | الفاعل |  |
| isActive | Boolean | Y | حالة الرابط | Orphan ممنوع قبل Available |
