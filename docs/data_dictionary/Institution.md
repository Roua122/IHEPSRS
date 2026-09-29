# Institution — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| institutionId | UUID/String | Y | المعرف المركزي | فريد؛ لا يعاد استخدامه |
| code | String(30) | Y | رمز المؤسسة | فريد فعال |
| nameAr | String(250) | Y | الاسم العربي |  |
| nameEn | String(250) | N | الاسم الإنجليزي |  |
| type | Enum | Y | University/Center/... | Reference data |
| status | Enum | Y | Active/Inactive/Archived |  |
| externalRefs | JSON/Child | N | معرفات الجهات الخارجية |  |
