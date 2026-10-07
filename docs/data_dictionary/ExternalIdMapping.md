# ExternalIdMapping — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| mappingId | UUID | Y | المعرف |  |
| sourceSystem | String | Y | المصدر |  |
| entityType | String | Y | نوع الكيان |  |
| externalId | String | Y | المعرف الخارجي | UNIQUE(sourceSystem,entityType,externalId) |
| canonicalId | UUID | Y | المعرف المركزي |  |
| effectiveFrom | Timestamp | Y | البداية |  |
| effectiveTo | Timestamp | N | النهاية |  |
| status | Enum | Y | Active/Retired/Merged |  |
