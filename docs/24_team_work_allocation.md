# Team Work Allocation — 7 Members

> استبدلوا `Member 1..7` بأسماء أعضاء الفريق عند الاتفاق النهائي.

| Member | Primary ownership | Main prototype responsibility |
|---|---|---|
| Member 1 | Foundation + Identity & Access | Project foundation, authentication, roles, authorization |
| Member 2 | Institutions + Programs | Institutions, org units, academic programs, reference data |
| Member 3 | Mock University + Integration | Mock SIS, student sync, integration monitor, retry/quarantine basics |
| Member 4 | Postgraduate | Applicant, applications, review, NeedMoreInfo, admission, enrollment |
| Member 5 | Thesis | Thesis lifecycle, supervisor, proposal, defense, corrections, approval |
| Member 6 | Research + Publications | Researcher/profile basics, research project basics, publication/authors |
| Member 7 | Dashboard + Audit + QA/Release | Dashboard, audit viewer, integration QA, acceptance/demo coordination |

## Shared responsibilities
الجميع مسؤول عن:
- قراءة الـBaseline والـPrototype Scope.
- الالتزام بـGit workflow.
- كتابة/تحديث الاختبارات الخاصة بمهامه.
- مراجعة Pull Request لعضو آخر.
- عدم تغيير Business Rule بصمت.
- تحديث Task/TODO بعد الدمج.

## Cross-review pairing
اقتراح:
- Member 1 ↔ Member 4
- Member 2 ↔ Member 5
- Member 3 ↔ Member 6
- Member 7 يراجع تكامل السيناريو النهائي ويشارك في مراجعات حرجة.

## Integration rule
لا تنتظروا نهاية المشروع للدمج.
يجب دمج أجزاء قابلة للتشغيل إلى `main` بشكل دوري، مع الحفاظ على نجاح البناء والاختبارات.
