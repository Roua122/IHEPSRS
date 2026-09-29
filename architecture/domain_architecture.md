# Domain Architecture — Analysis-Derived

Status: Analysis-derived architecture input.

| Domain | الوحدات | المخرجات الأساسية |
| --- | --- | --- |
| Identity & Access | Users, Roles, Scopes, Sessions | هوية وصلاحية قابلة للتدقيق |
| Institution Registry | Institution, OrgUnit, Program, Reference Data | مرجع موحد للمؤسسات والبرامج |
| Postgraduate | Application, Admission, Enrollment | دورة قبول وقيد |
| Thesis | Proposal, Supervision, Progress, Committee, Defense, Degree | سجل رسالة كامل |
| Research | Researcher, Proposal, Review, Project, Funding, Output | دورة بحث علمي |
| Publication | Publication, Authors, Validation | فهرس منشورات |
| Documents & Notifications | Files, Versions, Messages | مستندات وإشعارات |
| Integration | APIs, Adapters, Events, Batch, Mapping, Retry | تشغيل بيني ومراقبة |
| Reporting & Analytics | KPIs, Reports, Exports | رؤية إدارية |
| Audit & Monitoring | Audit Log, Technical telemetry | تتبع ومراقبة |

## Boundary rule
Domain boundaries may be implemented as modules or services. Physical deployment style is a Design Decision.
