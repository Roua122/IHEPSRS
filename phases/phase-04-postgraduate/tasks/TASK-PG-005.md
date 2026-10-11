# TASK-PG-005 — Enrollment lifecycle

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.6, 11, 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-013 — القيد الأكاديمي**: إنشاء Enrollment مع البرنامج والسنة والحالة بعد تحقق شروط القبول. (Priority: Must; Test: TC-FR-013)
- **FR-043 — إدارة سياسات قابلة للإصدار**: إدارة PolicyConfiguration حسب المؤسسة/البرنامج/الفوج مع effectiveFrom/effectiveTo/version وعدم تطبيق التغيير بأثر رجعي دون قرار. (Priority: Must; Test: TC-FR-043)
- **FR-045 — تاريخ الحالات واللقطات**: تسجيل StatusHistory للكيانات الحرجة ودعم Reporting Snapshot/As-of Date. (Priority: Must; Test: TC-FR-045)

## Business Rules
- **BR-003**: لا يمكن إنشاء قيد لطالب في برنامج غير فعال في تاريخ القيد. (Test: TC-BR-003)
- **BR-008**: إنشاء Enrollment يتطلب قرار قبول صالحًا مرتبطًا بنفس person/program/cycle. إذا أصبح البرنامج غير فعال قبل startDate فلا يُنشأ Active enrollment تلقائيًا؛ يدخل PendingValidation حتى قرار تحويل لنسخة/برنامج صالح أو إلغاء القرار مع السبب. (Test: TC-BR-008)
- **BR-009**: لا يملك الطالب أكثر من قيد فعال واحد لنفس البرنامج في المؤسسة نفسها إلا بإعفاء موثق. (Test: TC-BR-009)
- **BR-052**: الحد الأقصى لمدة الدراسة وعدد/مدة التمديدات يحددان في PolicyConfiguration لكل program/cohort. النظام يمنع تجاوز السياسة إلا عبر Exception قرار مسجل. (Test: TC-BR-052)
- **BR-053**: Freeze/Suspension، Withdrawal، Re-enrollment، Program Change عمليات مستقلة بقرارات وحالات تاريخية؛ لا تعدل Enrollment القديم لتبدو العملية وكأنها لم تحدث. (Test: TC-BR-053)
- **BR-054**: منح الدرجة يتطلب Enrollment مؤهلًا، استكمال ProgramRequirements، Thesis Approved عندما thesisRequired=true، وعدم وجود Holds إلزامية. DegreeDecision سجل مستقل ونهائي تشغيليًا. (Test: TC-BR-054)
- **BR-062**: الإعدادات التنظيمية (مدة دراسة، عبء، لجنة، متطلبات، Retention) Versioned وEffective-dated؛ السجلات القائمة تحتفظ policyVersion المطبق وقت القرار. (Test: TC-BR-062)

## Use Cases
- **UC-06 — إنشاء القيد وتعيين المشرف** — Acceptance: تاريخ كل مشرف محفوظ ولا يكتب فوق السابق.
- **UC-21 — تعليق/انسحاب/استكمال القيد** — Acceptance: الحالة التاريخية محفوظة ولا يوجد قيد فعال متعارض.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-021 — الزمن**: تخزين الطوابع الزمنية بصيغة موحدة UTC مع عرضها وفق المنطقة الزمنية للمستخدم/المؤسسة. (Verification: TC-NFR-021 / section 18.1.1)

## Goal
تنفيذ **Enrollment lifecycle** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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

## Implementation Handoff — 2026-10-11 (WIP; not accepted)

Implemented in `apps/api/src/postgraduate`:
- `EnrollmentLifecycleService` with accepted-decision/snapshot/SIS evidence gate (`PG004`, `BR-003/008/009`), scoped reads/writes, UTC dates, explicit state operations, immutable decision/history copies (`FR-013/045`, `BR-053`).
- `EnrollmentPolicyService` for explicit, approved, versioned Program/Cohort-scoped local policy records. No invented policy limits; policy must be approved before enrollment (`FR-043`, `BR-052/062`). Approval is PGA-scoped and forbids retroactive effective dates.
- Suspension/resume/withdrawal/cancellation/re-enrollment and extension/exception operations with reason and audit (`UC-21`, `BR-052/053`). Original withdrawn enrollments are never overwritten by re-enrollment.
- `DegreeDecision` operation **fails closed** until trusted `ProgramRequirements` / `Thesis` / `Holds` gateway is connected (`BR-054`). Never accept these readiness flags from HTTP input.
- As-of **status-history** response (`FR-045`) only; NOT an enterprise immutable reporting snapshot.

Integration blockers before Definition of Done / handoff to integration test owner:
1. **NFR-014**: Enrollment, policy configuration, DegreeDecision, audit and status history currently use in-memory Maps/arrays. Replace with transactionally persisted repository, unique live-enrollment constraint, and shared audit/outbox; current approach is NOT durable or multi-instance safe.
2. **FR-043/BR-062**: Replace mock scoped policy store with team's canonical `PolicyConfiguration` version/approval registry. `normalStudyMonths/maxStudyMonths/maxExtensions/maxExtensionMonths` schema and precedence are provisional, recorded in `decisions/architecture/ADR-PG-005-enrollment-policy.md` for approval. No policy is seeded by default.
3. **BR-054**: Connect `DegreeReadinessGateway` to verified Thesis + ProgramRequirements + Holds sources. Endpoint refuses approval until this integration exists.
4. **BR-053**: Program Change and documented BR-009 duplicate-enrollment exemptions require a team-approved decision/transfer contract and cannot be silently inferred from the supplied reference code. No unsafe generic status PATCH was provided.
5. **UC-06**: Supervisor assignment belongs to linked thesis workflow; coordinate TH tasks without inventing an assignment API here.
6. No tests added/run in this handoff: the team must still cover TC-FR-013/043/045, TC-BR-003/008/009/052/053/054/062 and TC-NFR-014/021 before closing the task. Shared tests may be executed by the designated reviewer, but the task's Definition of Done remains open.

The current implementation is **not equivalent to an integrated production or accepted PG005**. Do not mark task `DONE` until dependencies, verification and ADR review are finished.
