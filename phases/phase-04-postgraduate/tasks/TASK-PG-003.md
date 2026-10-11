# TASK-PG-003 — Review and NeedMoreInfo

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.5, 10
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-011 — مراجعة الطلب**: إسناد الطلب للمراجع وتسجيل القرار والملاحظات وطلبات الاستكمال. (Priority: Must; Test: TC-FR-011)
- **FR-012 — قرار القبول**: إصدار قبول أو رفض أو قبول مشروط مع سبب القرار وتاريخه. (Priority: Must; Test: TC-FR-012)

## Business Rules
- **BR-007**: كل قرار رفض/إعادة للاستكمال يجب أن يتضمن سببًا. (Test: TC-BR-007)
- **BR-041**: NeedMoreInfo يطلبه Postgraduate Reviewer/Officer المخول فقط. يستطيع Applicant تعديل الحقول/الوثائق المحددة في الطلب فقط؛ تحتفظ المنصة بنسخة التقديم السابقة. firstSubmittedAt لا يتغير، وresubmittedAt يسجل كل إعادة؛ زمن NeedMoreInfo مستبعد من SLA القرار. (Test: TC-BR-041)

## Use Cases
- **UC-05 — مراجعة واتخاذ قرار طلب الدراسات العليا** — Acceptance: كل رفض يحمل سببًا؛ لا ينشأ قيد من طلب غير مقبول.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-021 — الزمن**: تخزين الطوابع الزمنية بصيغة موحدة UTC مع عرضها وفق المنطقة الزمنية للمستخدم/المؤسسة. (Verification: TC-NFR-021 / section 18.1.1)

## Goal
تنفيذ **Review and NeedMoreInfo** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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


## Implementation handoff (2026-10-11; pending verification)
- FR-011: a scoped PGO/PGA claims a `Submitted` application via `/review/start`;
  only that assigned officer may record an Eligibility/Academic review, recommend,
  or request `NeedMoreInfo`. Assigned review queue is available to the officer.
- FR-012 / BR-007: a PGA-only `/decision` records Accepted, Rejected, or
  ConditionalAccepted with a server-generated UTC timestamp, explicit reason,
  and effective `BusinessPolicyService` version. A rejected request cannot
  be used by PG004 to create Enrollment.
- **Conditional outcome decision (proposed ADR):**
  `ConditionalAccepted` lives in `AdmissionDecision`, not a new application
  status. The application stays `UnderReview` until a PGA clears documented
  conditions; only then does it become `Accepted`. See proposed
  `decisions/architecture/ADR-PG-003-conditional-admission.md`; PG004 must check both
  application status and decision clearance before enrollment. No automatic
  enrollment is created in PG003.
- BR-041: only the assigned, scoped reviewer can request `NeedMoreInfo`,
  and resubmission preserves the original snapshot/`firstSubmittedAt`.
  `/review/timing` subtracts recorded/open `NeedMoreInfo` intervals.
- Audit operations use the existing append-only service with correlation;
  notifications are queued in the local outbox. Delivery is NOT implemented.
- **Dependency / open item:** A trusted IAM reviewer directory for assigning
  another named staff user is not available in this checkout. Self-claim by
  a scoped officer is implemented; do not trust arbitrary reviewer userId.
- **Dependency / open item (NFR-014):** PG002/PG003 application records,
  review history and notification outbox remain in memory. Persistence and
  transactional outbox must be integrated with the team's chosen storage
  pattern before final acceptance. PG002's Document Gateway remains fail-closed
  until its shared adapter is implemented.
- Roua's final tests/quality gates have NOT been run for this handoff.
  Do not mark Definition of Done as complete yet.
