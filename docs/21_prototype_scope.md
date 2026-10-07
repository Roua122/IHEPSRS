# Prototype Scope — Source-Aligned Academic MVP/PoC

Source: Analysis Baseline — Section 17.3.

## Baseline MVP Split
| MVP ينفذ فعليًا | Future/Mock/Adapter في المشروع الأكاديمي |
| --- | --- |
| Institution Registry + Program reference | Full national master-data governance workflows |
| Student Integration simulator/adapter | Real integrations to every university |
| Applicant/Postgraduate Application + decision | Complex scholarship/financial admission |
| Enrollment + Thesis lifecycle + supervisor/defense | All regulation variations of every institution |
| Research Proposal + simple Project registry | Full grant accounting/procurement/project management |
| Publication + author mapping | External bibliometric providers at production scale |
| RBAC/Scope/Delegation + Audit | Enterprise IAM federation breadth |
| Integration retry/quarantine + dashboard | Production SIEM/SOC/large analytics warehouse |

## Team execution classification
- `IMPLEMENT`: الجزء الموجود في عمود MVP ينفذ فعليًا بدرجة تكفي لإثبات السيناريو.
- `MOCK`: External systems/providers يمكن محاكاتها في المشروع الأكاديمي.
- `DOCUMENTATION_ONLY`: Production-scale infrastructure/security/DR/warehouse تبقى موثقة إذا نص الـBaseline على ذلك.
- `FUTURE`: خارج نطاق المحاكاة الحالية.

## Important
هذا الملف لا يغير Full System Analysis Scope. هو يحدد **ما سنبنيه في المحاكاة الأكاديمية** فقط.
