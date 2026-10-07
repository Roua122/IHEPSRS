# ApplicationReview — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| applicationReviewId | UUID | Y | المعرف |  |
| applicationId | FK | Y | الطلب |  |
| reviewerUserId | FK | Y | المراجع |  |
| reviewType | String | Y | Eligibility/Academic/Final |  |
| decision | Enum | N | Approve/Reject/NeedMoreInfo |  |
| comments | Text | N | تعليق | تصنيف وصول مناسب |
| reviewedAt | Timestamp | N | وقت الإنهاء |  |
