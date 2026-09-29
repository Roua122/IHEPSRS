# ThesisCorrection — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| correctionId | UUID | Y | المعرف |  |
| thesisId | FK | Y | الرسالة |  |
| description | Text | Y | التعديل المطلوب |  |
| status | Enum | Y | Open/Resolved/Waived |  |
| dueDate | Date | N | الموعد |  |
| resolvedAt | DateTime | N | الإغلاق |  |
| verifiedByUserId | FK | N | المتحقق من الإغلاق | إلزامي عند Resolved |
| verifiedAt | Timestamp | N | وقت التحقق |  |
| required | Boolean | Y | هل التصحيح إلزامي |  |
