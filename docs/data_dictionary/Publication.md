# Publication — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| publicationId | UUID | Y | المعرف |  |
| title | String(1000) | Y | العنوان |  |
| type | Enum | Y | Article/Conference/Book/... |  |
| doi | String | N | DOI | فريد عند التحقق |
| publicationDate | Date | N | تاريخ النشر |  |
| venue | String | N | المجلة/المؤتمر |  |
| status | Enum | Y | الحالة |  |
