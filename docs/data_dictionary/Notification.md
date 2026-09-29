# Notification — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| notificationId | UUID | Y | المعرف |  |
| recipientUserId | FK | Y | المستلم |  |
| channel | Enum | Y | InApp/Email/SMS |  |
| templateCode | Ref | Y | القالب |  |
| status | Enum | Y | Queued/Sent/Failed/Read |  |
| createdAt | DateTime | Y | الإنشاء | UTC |
