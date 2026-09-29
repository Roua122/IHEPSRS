# ThesisCommitteeMember — Data Dictionary

Source: Analysis Baseline — Section 12.2.

| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| memberId | UUID | Y | المعرف |  |
| committeeId | FK | Y | اللجنة |  |
| personId | FK | Y | الشخص |  |
| role | Enum | Y | Chair/Examiner/... |  |
| affiliation | String | N | الانتماء |  |
| conflictDeclared | Boolean | Y | تعارض مصالح |  |
