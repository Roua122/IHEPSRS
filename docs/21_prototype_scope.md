# Prototype Scope — Academic PoC

> **قرار تنفيذ للمشروع الأكاديمي، وليس تعديلًا على Analysis Baseline.**
> وثيقة التحليل تظل تصف النظام الكامل.

## 1. الهدف
بناء نموذج أولي صغير لكنه متكامل يثبت:
- Architecture
- System Integration
- APIs / Events
- Business Workflows
- State Management
- RBAC
- Audit
- Data Persistence
- Dashboard / Reporting Basics

## 2. Classification Matrix

| Area | Classification | Priority | Prototype expectation |
|---|---|---:|---|
| Authentication | IMPLEMENT | MUST | Login أساسي آمن |
| RBAC / Scope | IMPLEMENT | MUST | أدوار وصلاحيات أساسية |
| Institutions | IMPLEMENT | MUST | جامعتان تجريبيتان وبيانات مرجعية |
| Academic Programs | IMPLEMENT | MUST | برامج تجريبية مع status/effective dates |
| Mock University SIS | MOCK | MUST | تطبيق/خدمة مستقلة ترسل Student data |
| Student Integration | IMPLEMENT | MUST | استقبال StudentUpsert ومعالجته |
| Integration Monitor | IMPLEMENT | MUST | Success / Duplicate / Validation Failure / Quarantine |
| Postgraduate Application | IMPLEMENT | MUST | Draft → Submitted → Review → Decision |
| NeedMoreInfo | IMPLEMENT | MUST | رجوع للمتقدم ثم إعادة الإرسال |
| Enrollment | IMPLEMENT | MUST | إنشاء القيد بعد القبول |
| Thesis | IMPLEMENT | MUST | دورة الرسالة الأساسية |
| Supervisor Assignment | IMPLEMENT | MUST | Main supervisor rules |
| Thesis Proposal | IMPLEMENT | MUST | Submit / Review / Approve |
| Thesis Defense | IMPLEMENT | MUST | Schedule + outcome |
| Corrections | IMPLEMENT | MUST | تسجيل التصحيحات والتحقق منها |
| Publication | IMPLEMENT | MUST | سجل نشر + authors/affiliations مبسط |
| Research Project | IMPLEMENT | SHOULD | إدارة مبسطة فقط |
| Documents | IMPLEMENT | SHOULD | رفع/ربط ملفات أساسية |
| Notifications | MOCK | SHOULD | In-app أو mock notification |
| Audit Log | IMPLEMENT | MUST | العمليات الحساسة |
| Dashboard | IMPLEMENT | MUST | مؤشرات بسيطة قابلة للعرض |
| Advanced KPI snapshots | DOCUMENTATION_ONLY | N/A | تصميم/توضيح فقط |
| Full Search Index | FUTURE | N/A | البحث الأساسي يكفي |
| SMS Gateway | MOCK | SHOULD | بدون مزود حقيقي |
| Email Provider | MOCK | SHOULD | اختياري |
| Finance System | FUTURE | N/A | خارج الـPrototype |
| HR System | FUTURE | N/A | تكامل موثق فقط |
| LMS | FUTURE | N/A | خارج التنفيذ |
| Library System | FUTURE | N/A | خارج التنفيذ |
| Enterprise SSO | MOCK | SHOULD | محاكاة أو Local Auth |
| Data Warehouse | DOCUMENTATION_ONLY | N/A | Architecture only |
| Full DR / Multi-site failover | DOCUMENTATION_ONLY | N/A | Architecture only |
| Off-site production backup | DOCUMENTATION_ONLY | N/A | Architecture only |
| Enterprise SIEM/WAF/HSM | DOCUMENTATION_ONLY | N/A | Security design only |
| Kubernetes | FUTURE | N/A | غير مطلوب لإثبات الفكرة |

## 3. قاعدة مهمة
إذا كان Requirement في النظام الكامل لكنه مصنف هنا `DOCUMENTATION_ONLY` أو `FUTURE`،
فلا يقوم الـAI أو المطور ببنائه تلقائيًا.

## 4. What proves the project?
نجاح السيناريو الموجود في `22_demo_scenario.md` هو المعيار الرئيسي لنجاح الـPrototype.
