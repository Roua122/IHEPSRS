# Document — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| documentId | UUID | Y | المعرف |  |
| documentType | Ref | Y | نوع الوثيقة |  |
| fileName | String | Y | الاسم |  |
| mimeType | String | Y | النوع |  |
| sizeBytes | Long | Y | الحجم | <=configured max |
| versionNo | Integer | Y | الإصدار | >=1 |
| storageRef | String | Y | مرجع التخزين | ليس مسارًا مكشوفًا |
| uploadedByUserId | FK | Y | من رفع الملف |  |
| uploadedAt | Timestamp | Y | وقت الرفع |  |
| status | Enum | Y | Uploaded/Scanning/Available/Quarantined/RejectedMalware/Archived |  |
| checksum | String | Y | بصمة سلامة المحتوى | SHA-256 أو ما يعادله |
| securityClassification | Enum | Y | Public/Internal/Confidential/Restricted | يحدد الوصول/التصدير |
| malwareScanAt | Timestamp | N | وقت الفحص |  |
| retentionClass | String | Y | سياسة الاحتفاظ |  |
