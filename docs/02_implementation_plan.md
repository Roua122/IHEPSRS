# Implementation Plan — Prototype Execution

> الـPhases هنا تنظيم للعمل وليست Waterfall صارمًا.

## Stage A — Shared Foundation
- Phase 01 — Foundation
- الحد الأدنى من Phase 02 — Identity & Access
- الحد الأدنى من Phase 03 — Institutions & Programs

الهدف: Repository قابل للتشغيل، Auth/RBAC، بيانات مؤسسة/برنامج تجريبية.

## Stage B — Parallel Domain Work
بعد ثبات الأساس يمكن العمل بالتوازي:
- Member 3: Mock University + Integration
- Member 4: Postgraduate
- Member 5: Thesis
- Member 6: Research/Publications
- Member 7: Dashboard/Audit/QA

## Stage C — Vertical Integration
ربط:
`Mock SIS → Integration → PG → Thesis → Publication → Dashboard/Audit`

## Stage D — Hardening for Demo
- Security checks
- Accessibility basics
- Error handling
- Demo seed data
- Acceptance tests
- Release/demo preparation

## Rule
الأولوية ليست إكمال جميع Full-System requirements؛ الأولوية هي إكمال
`docs/22_demo_scenario.md`.

## Production-only concerns
العناصر المصنفة `DOCUMENTATION_ONLY` تظل مخرجات Architecture/Documentation ولا تعطل إغلاق الـPrototype.
