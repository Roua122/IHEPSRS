# ProposalReview — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| reviewId | UUID | Y | المعرف |  |
| proposalId | FK | Y | المقترح |  |
| reviewerId | FK | Y | المحكم |  |
| conflictStatus | Enum | Y | Clear/Conflict |  |
| score | Decimal | N | الدرجة | وفق النموذج |
| recommendation | Enum | N | التوصية |  |
| comments | Text | N | الملاحظات |  |
