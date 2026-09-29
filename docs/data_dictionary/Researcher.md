# Researcher — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| researcherId | UUID | Y | المعرف |  |
| personId | FK | Y | الشخص |  |
| institutionId | FK | Y | المؤسسة الرئيسية |  |
| orcid | String | N | ORCID | فريد إن تحقق |
| specializationCode | Ref | N | التخصص |  |
| status | Enum | Y | Active/Inactive |  |
