# Person — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| personId | UUID | Y | المعرف المركزي للشخص |  |
| nationalIdentifier | String | N | معرف وطني إن سمح النظام | Encrypted at rest + HMAC fingerprint للمطابقة؛ Masked في العرض/logs |
| fullNameAr | String(300) | N | الاسم الكامل | يلزم fullNameAr أو fullNameEn واحد على الأقل |
| fullNameEn | String(300) | N | الاسم الإنجليزي |  |
| birthDate | Date | N | تاريخ الميلاد | حسب الحاجة |
| email | String | N | البريد | صيغة بريد |
| mobile | String | N | الهاتف |  |
| status | Enum | Y | Active/Archived |  |
