# UserAccount — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| userId | UUID | Y | معرف الحساب |  |
| personId | FK | Y | الشخص |  |
| username | String | Y | اسم الدخول | فريد |
| status | Enum | Y | حالة الحساب |  |
| mfaRequired | Boolean | Y | وجوب MFA |  |
| lastLoginAt | DateTime | N | آخر دخول | UTC |
