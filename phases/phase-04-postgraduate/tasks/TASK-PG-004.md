# TASK-PG-004 — Admission decision

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.5
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-012 — قرار القبول**: إصدار قبول أو رفض أو قبول مشروط مع سبب القرار وتاريخه. (Priority: Must; Test: TC-FR-012)

## Business Rules
- **BR-007**: كل قرار رفض/إعادة للاستكمال يجب أن يتضمن سببًا. (Test: TC-BR-007)
- **BR-008**: إنشاء Enrollment يتطلب قرار قبول صالحًا مرتبطًا بنفس person/program/cycle. إذا أصبح البرنامج غير فعال قبل startDate فلا يُنشأ Active enrollment تلقائيًا؛ يدخل PendingValidation حتى قرار تحويل لنسخة/برنامج صالح أو إلغاء القرار مع السبب. (Test: TC-BR-008)

## Use Cases
- **UC-05 — مراجعة واتخاذ قرار طلب الدراسات العليا** — Acceptance: كل رفض يحمل سببًا؛ لا ينشأ قيد من طلب غير مقبول.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Admission decision** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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

## Implementation note — TASK-PG-004, 2026-10-11 (WIP; not accepted)

**In this branch, after PG003**:
- `FR-012`, `BR-007`: PG003 already implemented the scoped PGA-only `Accepted` / `Rejected` / `ConditionalAccepted` domain decision, timestamp, mandatory reason, and pinned effective `policyVersionId`. PG004 reuses these operations instead of adding a duplicate decision endpoint.
- `BR-008`: `AdmissionDecisionEvidenceService.assertLatestSubmissionConsistent` now blocks a formal decision and conditional-clearance transition if the current immutable submission no longer matches the application's canonical Person, program, cycle and institution registry references.
- `BR-008`: `ApplicationWorkflowService.admissionEvidenceForEnrollment` is an **internal, scoped** handoff to PG005. It refuses Rejected, missing/unrecorded, or uncleared conditional decisions and verifies target person/institution/program/cycle against the latest submission. The evidence carries decision ID, source snapshot, decision time and historical policy version.
- `BR-008`: if a program is inactive or outside its effective dates at the proposed `startDate`, the handoff is `PendingValidation` (never an automatic `Active`). It **does not** create a new enrollment or alter any business status. PG005 owns the Enrollment write, student validation and program-change/cancellation workflow.
- `NFR-011`: a successful scoped read of sensitive admission enrollment evidence is audited with the existing correlation/hash-chain audit service. No unscoped HTTP endpoint is added.

**Dependencies before the shared acceptance and Definition of Done**:
- `NFR-014`/`NFR-011`: the uploaded project keeps applications, decisions, audit entries and notification outbox in memory. A real transactional persistent store and durable append-only/WORM audit must be integrated by the team. This patch makes **no** durability claim.
- The current `AcademicReferenceService` is a mock; integrate the authoritative Institution/Program Registry and approved effective policies, without silently changing the Baseline.
- The proposed representation of conditional acceptance in `decisions/architecture/ADR-PG-003-conditional-admission.md` remains subject to team approval.
- `PG005` MUST call `admissionEvidenceForEnrollment` with its trusted proposed target and date **before** inserting an Enrollment, and enforce all other `FR-013`/`BR-008` conditions. This is not implemented in PG004.
- Review and integration/QA for `TC-FR-012`, `TC-BR-007`, `TC-BR-008`, `TC-NFR-011`, `TC-NFR-014` and UC-05 remain pending with the team. `Status: TODO` and unchecked Definition of Done are intentionally retained.
