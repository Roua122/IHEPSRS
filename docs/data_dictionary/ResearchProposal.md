# ResearchProposal — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| proposalId | UUID | Y | المعرف |  |
| principalResearcherId | FK | Y | الباحث الرئيس |  |
| title | String(1000) | Y | العنوان |  |
| abstract | Text | Y | الملخص |  |
| status | Enum | Y | الحالة | State model |
| submittedAt | DateTime | N | التقديم |  |
| decision | Enum | N | القرار |  |
| decisionAt | DateTime | N | وقت القرار |  |
