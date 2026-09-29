# RoleAssignment — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| assignmentId | UUID | Y | المعرف |  |
| userId | FK | Y | الحساب |  |
| roleCode | Ref | Y | الدور |  |
| institutionId | FK | N | نطاق المؤسسة | null للدور المركزي |
| validFrom | DateTime | Y | بداية |  |
| validTo | DateTime | N | نهاية مؤقتة |  |
| grantedBy | FK | Y | المانح |  |
