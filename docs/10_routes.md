# Routes Catalogue — Proposed Design

> هذه المسارات **Design-derived** من Use Cases وليست نصًا حرفيًا من Analysis Baseline.
> تغيير URL لا يحتاج Change Request ما دام السلوك والصلاحيات والمعنى لا يتغيران.

| Route ID | Path | Page | Primary UC | Source status |
| --- | --- | --- | --- | --- |
| ROUTE-AUTH-01 | /login | LoginPage | UC-01 | Design-derived |
| ROUTE-DB-01 | /dashboard | DashboardPage | UC-14 | Design-derived |
| ROUTE-INS-01 | /institutions | InstitutionsPage | UC-02 | Design-derived |
| ROUTE-INS-02 | /programs | ProgramsPage | UC-02 | Design-derived |
| ROUTE-STU-01 | /students | StudentsPage | UC-03, UC-13 | Design-derived |
| ROUTE-PG-01 | /postgraduate/applications | ApplicationsPage | UC-04, UC-05 | Design-derived |
| ROUTE-PG-02 | /postgraduate/applications/:id | ApplicationDetailsPage | UC-04, UC-05 | Design-derived |
| ROUTE-PG-03 | /enrollments | EnrollmentsPage | UC-06, UC-21 | Design-derived |
| ROUTE-TH-01 | /theses | ThesesPage | UC-07..UC-09, UC-22 | Design-derived |
| ROUTE-TH-02 | /theses/:id | ThesisDetailsPage | UC-07..UC-09, UC-22 | Design-derived |
| ROUTE-RS-01 | /research/projects | ResearchProjectsPage | UC-10, UC-11 | Design-derived |
| ROUTE-PUB-01 | /publications | PublicationsPage | UC-12 | Design-derived |
| ROUTE-INT-01 | /integrations/messages | IntegrationMonitorPage | UC-15, UC-20 | Design-derived |
| ROUTE-AUD-01 | /audit | AuditPage | UC-17, UC-18 | Design-derived |
| ROUTE-ADM-01 | /settings/users | UsersPage | UC-17, UC-19, UC-24 | Design-derived |

## Authorization
كل Route محمية تستخدم Role + Scope + Resource + Action + Record State؛ لا يعتمد الحماية على إخفاء الرابط فقط.
