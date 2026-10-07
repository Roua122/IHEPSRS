# ResearchOutput — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| outputId | UUID | Y | المعرف |  |
| projectId | FK | Y | المشروع |  |
| outputType | String | Y | Dataset/Report/Prototype/Publication/Other |  |
| title | String | Y | العنوان |  |
| status | Enum | Y | Planned/Submitted/Accepted/Archived |  |
| documentId | FK | N | الوثيقة | عبر DocumentLink |
| completedAt | Timestamp | N | الإنجاز |  |
