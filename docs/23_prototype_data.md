# Prototype Test Data

## Source Capacity Baseline
| البند | Baseline |
| --- | --- |
| Records | 150K postgraduate applications/enrollments؛ 100K Researchers/Faculty؛ 250K Thesis records؛ 200K ResearchProposal/Project؛ 1.5M canonical Publications/ResearchOutputs؛ 5M Document metadata. كل الأرقام Design Assumptions لا إحصاءات رسمية. |
| Concurrent Users | 2,000 peak design baseline؛ profile: 70% read / 25% write / 5% report/upload؛ scalable to 5,000 دون تغيير domain logic. |
| API Throughput | 100 req/s sustained baseline لمدة 15 دقيقة، burst 200 req/s لمدة 1 دقيقة؛ يقاس على CRUD/API داخلية دون external dependency. |
| Documents | 10TB planning envelope للمحتوى + 5M metadata records؛ growth 20%/year design assumption؛ object storage expected. |
| Availability | 99.5% monthly for core services only, excluding approved maintenance; reporting heavy jobs separate. |
| RPO / RTO | Core DB/Audit RPO ≤1h, RTO ≤2h؛ Analytics RTO ≤8h؛ document object store RPO ≤24h unless replicated continuously. |
| Interactive UX | P95 ≤3s للعمليات المحددة في NFR-001 تحت Load Profile أعلاه. |
| Standard API | P95 ≤1.5s internal CRUD excluding external call/file/report. |
| Heavy Reports | ≤15s إذا interactive؛ خلاف ذلك async job مع progress/result notification. |
| Integration Freshness | Event: 95% processed ≤5m from receivedAt؛ alert if source freshness >15m. Batch daily: completion ≤26h from scheduled start. |

## Academic Prototype Seed Recommendation
هذه أحجام **اختبار للمحاكاة** وليست تعديلًا على NFR-003:
- 2 Universities
- 4 Colleges
- 6 Departments
- 8 Programs
- 30–50 Students/Applicants
- 10 Faculty/Researchers
- 10 Postgraduate Applications
- 5 Enrollments
- 5 Theses
- 3 Research Projects
- 5 Publications
- 30–100 Integration Messages

## Rule
Production capacity assumptions and Prototype seed size are separate concepts.
