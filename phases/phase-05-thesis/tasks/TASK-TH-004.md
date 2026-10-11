# TASK-TH-004 — Thesis submission

Status: IN_PROGRESS (implementation WIP; shared gateways pending)
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.8, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-016 — دورة حياة الرسالة**: إدارة الحالات والانتقالات من التسجيل حتى الاعتماد والأرشفة. (Priority: Must; Test: TC-FR-016)
- **FR-029 — إدارة الوثائق**: رفع وتصنيف وإصدار الوثائق والتحقق من النوع والحجم وربطها بالكيانات. (Priority: Must; Test: TC-FR-029)

## Business Rules
- **BR-015**: لا يمكن جدولة المناقشة قبل حالة Submitted واستكمال متطلبات اللجنة. (Test: TC-BR-015)
- **BR-036**: ملفات الرسائل/المقترحات لا تستبدل بصمت؛ يحتفظ النظام برقم إصدار أو أثر التحديث. (Test: TC-BR-036)
- **BR-045**: Thesis content Versioned. Proposal/Submission/Approved كل منها ThesisVersion مستقل؛ Title/Abstract المعتمد لا يعدل مباشرة، وأي تغيير جوهري ينتج Amendment + version جديد. (Test: TC-BR-045)

## Use Cases
- **UC-08 — تقديم الرسالة وتكوين لجنة المناقشة** — Acceptance: لا يمكن جدولة جلسة بلا لجنة مكتملة أو رسالة Submitted.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-022 — الملفات**: رفع الملفات عبر قناة منفصلة؛ الحد الافتراضي 200MB قابل للتهيئة. التحقق من MIME/content، منع الأنواع الخطرة، Malware scan، quarantine قبل الإتاحة، checksum، وchunked/resumable upload عند الملفات الكبيرة. (Verification: TC-NFR-022 / section 18.1.1)

## Goal
تنفيذ **Thesis submission** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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

## Implementation progress — TASK-TH-004 (WIP)
- `POST /theses/:thesisId/submission/versions`: creates an append-only
  `ThesisVersion(type=Submission)` using the approved title/abstract snapshot
  and a classified, scan-cleared final Thesis `DocumentLink` (FR-016/029,
  BR-036/045/057, NFR-022). The Document service owns upload/quarantine.
- `POST /theses/:thesisId/submission/supervisor-confirm`: the TH002-owned
  Main Supervisor gateway verifies the authenticated reviewer and returns
  current assignment evidence; sign-off is tied to one Submission version.
- `POST /theses/:thesisId/submission/submit`: rejects a wrong status, missing
  version/document/sign-off, changed Main Supervisor, inactive Enrollment or
  unsatisfied/mismatched institutional program requirements; appends the
  Submitted transition and timestamps (UC-08, Baseline 11.1, NFR-014).
- `ThesisEntityService.assertSubmittedForDefense`: a guard for the TH005-owned
  committee/defence workflow. It cannot schedule a defence, and TH005 must
  independently verify the approved, complete, nonduplicated committee
  (BR-015/016). **Do not register scheduling routes here.**
- Existing `Proposal`/`Approved`/`Amendment` versions and their histories
  are not rewritten by TH004.

### Pending shared integration / limitations (not Definition of Done)
- Replace the fail-closed `ThesisDocumentGateway.resolveAvailableSubmissionLink`
  with the classified, `Available` DocumentLink adapter. The shared Document
  service owns MIME/content, checksum, malware scan, quarantine and resumable
  upload (FR-029/NFR-022). Until then document operations return 503.
- Replace the fail-closed `ThesisSubmissionRequirementsGateway` with versioned
  ProgramRequirements evidence from the institution/program authority; no
  unapproved hard-coded policy defaults or user-provided completion flags.
- Integrate TH002 Main SupervisorAssignment/identity source of truth. Until
  then sign-off and submission return 503.
- Replace the process-local Maps/Audit projection with one durable
  transactional repository/outbox before asserting NFR-014 acceptance.
- The task's FR/BR/NFR tests, end-to-end integration and the prototype
  acceptance checklist remain pending the team's agreed review process.
