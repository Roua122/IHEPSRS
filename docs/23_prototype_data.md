# Prototype Dataset

> هذه الأرقام **بيانات اختبار للمحاكاة فقط** وليست Production Capacity Baseline ولا إحصاءات عن اليمن.

## Recommended Seed Data

| Entity | Prototype target |
|---|---:|
| Universities | 2 |
| Colleges | 4 |
| Departments | 6 |
| Academic Programs | 8 |
| Students / Applicants | 40 |
| Faculty / Researchers | 10 |
| Postgraduate Applications | 10 |
| Active Enrollments | 5 |
| Theses | 5 |
| Research Projects | 3 |
| Publications | 5 |
| Integration Systems | 2 |
| Integration Messages | 30–100 test messages |

## Required test examples
يجب أن توجد بيانات تسمح باختبار:
- Accepted application
- Rejected application
- NeedMoreInfo
- Duplicate integration message
- Validation failure
- Thesis corrections
- Publication with multiple authors
- Unauthorized action
- Audit record creation

## Rule
اختبارات السعة الكبيرة تبقى مرتبطة بـAnalysis/NFR design baseline، وليس بحجم Seed Data هذا.
