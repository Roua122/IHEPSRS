# Analysis-Frozen vs Design-Decided

Source: Analysis Baseline — Section 20.

## Design Outputs Required
| مخرج التصميم | المدخل من هذه الوثيقة |
| --- | --- |
| System Context / Container Architecture | Sections 3,5,13 |
| Component Diagram | Domains + FRs + integration boundaries |
| ERD / Logical Data Model | Section 12 + Business Rules |
| Physical Database Design | Data Dictionary + sizing + retention/audit rules |
| API Specification | Use Cases + Integration Contracts + errors |
| Sequence Diagrams | UC flows + state transitions + INT scenarios |
| Security Architecture | Section 14 + RBAC matrix + NFRs |
| Deployment Architecture | NFR 3-7 + availability + dependencies |
| UI Information Architecture | Actors + UCs + permissions + states |
| Test Plan | Acceptance + Traceability + errors + NFRs |

## Design-Decided (not analysis gaps)
- Programming language/framework.
- DB/storage technology subject to NFR/data constraints.
- Modular Monolith vs Microservices subject to domain boundaries/team/risk/scalability.
- Message broker/queue technology.
- Caching/indexing/load balancing details.
- Visual UI design subject to journeys/accessibility/permissions.
- Analytics physical pattern: Data Warehouse / Read Models / equivalent.
- Development/Testing/Staging/Production details and CI/CD/rollback.
- File/search/malware/KMS/secrets implementation technologies.
- Legacy migration execution mechanics.
- Failover/replication/clustering mechanism that meets RTO/RPO/availability.

## Frozen without Change Request
- In Scope / Out of Scope.
- Source of Truth.
- State/business decision rules.
- Fundamental authorization requirements.
- Integration idempotency / duplicate prevention.
- Must requirements and acceptance meaning.
