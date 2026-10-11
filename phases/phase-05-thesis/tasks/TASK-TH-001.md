# TASK-TH-001 — Thesis entity/versioning

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 11, 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-015 — مقترح الرسالة**: تسجيل عنوان الرسالة وملخصها وخطتها واعتماد المقترح قبل بدء التنفيذ. (Priority: Must; Test: TC-FR-015)
- **FR-016 — دورة حياة الرسالة**: إدارة الحالات والانتقالات من التسجيل حتى الاعتماد والأرشفة. (Priority: Must; Test: TC-FR-016)
- **FR-029 — إدارة الوثائق**: رفع وتصنيف وإصدار الوثائق والتحقق من النوع والحجم وربطها بالكيانات. (Priority: Must; Test: TC-FR-029)
- **FR-045 — تاريخ الحالات واللقطات**: تسجيل StatusHistory للكيانات الحرجة ودعم Reporting Snapshot/As-of Date. (Priority: Must; Test: TC-FR-045)

## Business Rules
- **BR-010**: لا تسجل رسالة فعالة لطالب دون قيد دراسات عليا فعال. (Test: TC-BR-010)
- **BR-014**: بعد اعتماد المقترح، تغيير العنوان الجوهري يتطلب طلب تعديل وموافقة وتدقيق. (Test: TC-BR-014)
- **BR-036**: ملفات الرسائل/المقترحات لا تستبدل بصمت؛ يحتفظ النظام برقم إصدار أو أثر التحديث. (Test: TC-BR-036)
- **BR-045**: Thesis content Versioned. Proposal/Submission/Approved كل منها ThesisVersion مستقل؛ Title/Abstract المعتمد لا يعدل مباشرة، وأي تغيير جوهري ينتج Amendment + version جديد. (Test: TC-BR-045)

## Use Cases
- **UC-07 — تسجيل واعتماد مقترح الرسالة** — Acceptance: لا تنتقل الرسالة إلى InProgress قبل اعتماد المقترح.
- **UC-08 — تقديم الرسالة وتكوين لجنة المناقشة** — Acceptance: لا يمكن جدولة جلسة بلا لجنة مكتملة أو رسالة Submitted.
- **UC-09 — تسجيل نتيجة المناقشة واعتماد الرسالة** — Acceptance: لا يمكن Approved مع Corrections مفتوحة.
- **UC-22 — تقارير تقدم الرسالة** — Acceptance: ThesisProgress محفوظ ومؤرخ دون تغيير تاريخي.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-022 — الملفات**: رفع الملفات عبر قناة منفصلة؛ الحد الافتراضي 200MB قابل للتهيئة. التحقق من MIME/content، منع الأنواع الخطرة، Malware scan، quarantine قبل الإتاحة، checksum، وchunked/resumable upload عند الملفات الكبيرة. (Verification: TC-NFR-022 / section 18.1.1)

## Goal
تنفيذ **Thesis entity/versioning** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

## Required Implementation Behavior
1. تحقق من الصلاحية والنطاق قبل أي إجراء حساس.
2. استخدم State/Business operations بدل تعديل حالات مباشر.
3. اكتب Audit/Correlation عند ما تتطلبه المراجع.
4. لا تتجاوز Source of Truth أو قواعد التاريخ/الإصدار.
5. أي قرار تقني غير محسوم يسجل ADR ولا يعدّل الـBaseline.

## Verification
- اختبارات FR/BR/NFR المذكورة أعلاه هي مصدر أسماء حالات الاختبار.
- أضف Integration/Unit/UI tests اللازمة للمهمة مع الاحتفاظ بمعرف المصدر في اسم/metadata الاختبار.
- تحقق من `docs/25_prototype_acceptance.md` إذا كانت المهمة `MUST`.

## Definition of Done
- [ ] Implemented according to `Implementation` classification.
- [ ] Source IDs referenced in code/tests/PR where relevant.
- [ ] Required validation/state rules enforced.
- [ ] Authorization/scope checked.
- [ ] Audit/observability handled where required.
- [ ] Tests pass.
- [ ] No secrets committed.
- [ ] Documentation affected by the change updated.
- [ ] No new business rule/status/field ownership introduced without CR/ADR as applicable.

## Implementation Handoff — 2026-10-11 (WIP, not accepted)
- Created an authenticated Thesis module and `ThesisEntityService` for Draft and
  Registered operations using the trusted Active Enrollment and academic unit
  (FR-016, BR-010). No arbitrary status update route is exposed.
- Established the Baseline section 11 Thesis transition allowlist for owner
  workflows TH002-TH008; guard checks live in the entity service.
- Added append-only `ThesisVersion` Proposal snapshots and sequential version
  numbers (FR-015, BR-036, BR-045), plus title `AmendmentRequest`/authorized
  approval and rejection, preserving previous versions (BR-014).
- Added append-only student progress summaries, scoped reads and status-as-of
  snapshots through existing AcademicAudit and parent Enrollment checks
  (FR-045/UC-22). Supervisor assessments remain TH002-owned.
- Document validation is an explicit fail-closed gateway pending a real shared
  Document/DocumentLink service; it does NOT upload or scan files (FR-029,
  NFR-022/BR-057). Until connected, linked proposal documents return 503.
- TH002 owns supervisor assignment; TH003 owns proposal submit/review/approval;
  TH004 owns thesis submission. No fake evidence or direct status edits are
  implemented for these collaborators.
- Current Map + audit implementation is prototype-only. Transactional storage,
  migrations, document services, and full end-to-end acceptance are pending
  (NFR-014). Team integration/tests are still required. Do not mark DONE yet.
