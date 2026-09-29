# IntegrationSystem — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| integrationSystemId | UUID | Y | المعرف |  |
| code | String | Y | رمز النظام | فريد |
| name | String | Y | الاسم |  |
| institutionId | FK | Conditional | المؤسسة | إلزامي لأي نظام مؤسسي؛ NULL فقط لخدمة مركزية مشتركة موثقة |
| status | Enum | Y | Active/Disabled |  |
| authProfileRef | String | Y | مرجع بيانات الاعتماد | Reference فقط إلى Secrets/KMS؛ لا يحمل secret |
| credentialRotatedAt | Timestamp | N | آخر تدوير |  |
| credentialRotationDueAt | Timestamp | N | موعد التدوير | default ≤90d |
| contractVersion | String | Y | نسخة العقد |  |
