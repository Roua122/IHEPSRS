# TASK-FND-003 — Common error model

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 1

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 16
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- لا يوجد FR واحد مباشر؛ المهمة Cross-cutting/Design-enabling.

## Business Rules
- **BR-007**: كل قرار رفض/إعادة للاستكمال يجب أن يتضمن سببًا. (Test: TC-BR-007)
- **BR-031**: التعارض يحسم أولًا بملكية الحقل Field-Level Source of Truth. إذا تعذر الحسم أو ظهرت Race/انقطاع طويل ينشأ DataConflict ولا يتم overwrite صامتًا. (Test: TC-BR-031)

## Use Cases
- لا توجد Use Case واحدة مباشرة؛ المهمة داعمة لعدة تدفقات.

## Non-Functional Requirements
- **NFR-018 — سهولة الاستخدام**: العمليات الرئيسية قابلة للتنفيذ دون تدريب تقني، مع رسائل خطأ مفهومة وإرشادات للحقول الإلزامية. (Verification: TC-NFR-018 / section 18.1.1)

## Goal
تنفيذ **Common error model** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
