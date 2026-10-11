# TASK-TH-003 — Proposal workflow

Status: IN_PROGRESS
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.7, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-015 — مقترح الرسالة**: تسجيل عنوان الرسالة وملخصها وخطتها واعتماد المقترح قبل بدء التنفيذ. (Priority: Must; Test: TC-FR-015)
- **FR-029 — إدارة الوثائق**: رفع وتصنيف وإصدار الوثائق والتحقق من النوع والحجم وربطها بالكيانات. (Priority: Must; Test: TC-FR-029)

## Business Rules
- **BR-013**: لا يعتمد مقترح الرسالة إلا من دور مخول وفق المؤسسة/البرنامج. (Test: TC-BR-013)
- **BR-014**: بعد اعتماد المقترح، تغيير العنوان الجوهري يتطلب طلب تعديل وموافقة وتدقيق. (Test: TC-BR-014)
- **BR-045**: Thesis content Versioned. Proposal/Submission/Approved كل منها ThesisVersion مستقل؛ Title/Abstract المعتمد لا يعدل مباشرة، وأي تغيير جوهري ينتج Amendment + version جديد. (Test: TC-BR-045)

## Use Cases
- **UC-07 — تسجيل واعتماد مقترح الرسالة** — Acceptance: لا تنتقل الرسالة إلى InProgress قبل اعتماد المقترح.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-022 — الملفات**: رفع الملفات عبر قناة منفصلة؛ الحد الافتراضي 200MB قابل للتهيئة. التحقق من MIME/content، منع الأنواع الخطرة، Malware scan، quarantine قبل الإتاحة، checksum، وchunked/resumable upload عند الملفات الكبيرة. (Verification: TC-NFR-022 / section 18.1.1)

## Goal
تنفيذ **Proposal workflow** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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

## Implementation checkpoint (TH003)
- Proposal submission/assigned-supervisor review/committee return/approval/InProgress use explicit domain operations, verified ThesisVersion, audit and institution/program authorization.
- No implicit supervisor assignment or trusted reviewer data from the client. TH002 must provide `ThesisSupervisorGateway` and verified Main assignment and reviewer identity; TH003 implements version-bound supervisor sign-off. Its default adapter fails closed with 503.
- FR-029/NFR-022 requires the shared `ThesisDocumentGateway` to validate an Available, correctly bound Thesis plan document. Default adapter fails closed with 503; no fake uploads or unscanned files.
- TH001/TH003 currently use a prototype in-memory aggregate/audit; NFR-014 requires replacing it with a durable shared transaction before final sign-off. No business rule was silently relaxed.
- Unit/integration/security checks and prototype acceptance are owned by the team verification process and have not been claimed as passed by this checkpoint.
