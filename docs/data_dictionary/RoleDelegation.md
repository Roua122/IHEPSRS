# RoleDelegation — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| delegationId | UUID | Y | المعرف |  |
| delegatorUserId | FK | Y | المفوِّض |  |
| delegateUserId | FK | Y | المفوَّض له |  |
| roleCode | String | Y | الدور المفوض | لا أوسع من المفوض |
| scopeType/scopeId | String/UUID | Y | النطاق |  |
| startAt | Timestamp | Y | البداية |  |
| endAt | Timestamp | Y | النهاية | endAt>startAt |
| reason | String | Y | السبب |  |
| status | Enum | Y | Pending/Active/Expired/Revoked |  |
