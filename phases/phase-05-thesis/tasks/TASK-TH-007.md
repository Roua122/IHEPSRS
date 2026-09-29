# TASK-TH-007 — Corrections and verification

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: دعاء عبد الواحد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.9, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-016 — دورة حياة الرسالة**: إدارة الحالات والانتقالات من التسجيل حتى الاعتماد والأرشفة. (Priority: Must; Test: TC-FR-016)
- **FR-020 — اعتماد الدرجة**: توثيق القرار النهائي وربط الرسالة بالدرجة وتاريخ المنح. (Priority: Must; Test: TC-FR-020)

## Business Rules
- **BR-018**: لا تنتقل الرسالة إلى Approved إذا كانت هناك تعديلات إلزامية غير مغلقة. (Test: TC-BR-018)
- **BR-047**: PassWithCorrections ينشئ ThesisCorrection إلزامية. لا ينتقل Thesis إلى Approved إلا بعد verifiedByUserId/verifiedAt وإغلاق كل التصحيحات الإلزامية. (Test: TC-BR-047)

## Use Cases
- **UC-09 — تسجيل نتيجة المناقشة واعتماد الرسالة** — Acceptance: لا يمكن Approved مع Corrections مفتوحة.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Corrections and verification** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
