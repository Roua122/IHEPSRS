# Deployment Architecture — Constraints

Status: Design pending; constraints frozen by Analysis Baseline.

## Availability / Recovery Inputs
| البند | Baseline |
| --- | --- |
| DB backup | Full daily + PITR/log ≤15m؛ encrypted. |
| Retention | 35 daily restore points + 12 monthly copies كافتراض مشروع؛ Audit retention 7 years. |
| Off-site | Encrypted copy خارج موقع/منطقة التشغيل يوميًا؛ access by DR role only. |
| Documents | Object versioning/snapshot daily؛ checksum verification after restore. |
| Restore testing | Quarterly restore drill؛ سنويًا full DR exercise للسيناريو الأساسي. |
| Disaster scenarios | Primary DB loss؛ object storage corruption؛ credential compromise؛ integration queue loss؛ site outage. |
| Declare disaster | Incident Commander/Security+Operations lead حسب Runbook؛ القرار والتوقيت Audit. |
| Authorize recovery | Operations lead + Domain owner للبيانات الحرجة؛ dual approval على destructive recovery. |
| Recovery verification | Integrity checks، sample business transactions، message offsets/idempotency check، security key validation، sign-off before reopen. |

## Capacity / Quality Inputs
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

## Required design properties
- Meet service availability NFRs.
- Meet RTO/RPO targets.
- Separate environments and secrets appropriately.
- Support rollback/release traceability.
- External integration failure must not take down unrelated functions.

## Not decided by Analysis
Cloud/on-premise, topology, clustering, replication and container/orchestration technology.
