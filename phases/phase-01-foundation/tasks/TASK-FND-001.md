# TASK-FND-001 — Project skeleton and conventions

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رؤى محمد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 20.1, 20.2
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- لا يوجد FR واحد مباشر؛ المهمة Cross-cutting/Design-enabling.

## Business Rules
- لا توجد BR مباشرة محددة لهذه المهمة؛ لا يجوز أن تتجاوز أي BR عامة ذات صلة.

## Use Cases
- لا توجد Use Case واحدة مباشرة؛ المهمة داعمة لعدة تدفقات.

## Non-Functional Requirements
- **NFR-016 — قابلية الصيانة**: الوحدات ذات حدود واضحة وعقود مستقرة، مع عدم الوصول المباشر بين قواعد بيانات الأنظمة الخارجية والمنصة. (Verification: TC-NFR-016 / section 18.1.1)
- **NFR-023 — قابلية الاختبار**: كل متطلب Must/Should له معيار قبول قابل للاختبار أو حالة اختبار مرتبطة في RTM. (Verification: TC-NFR-023 / section 18.1.1)

## Goal
تنفيذ **Project skeleton and conventions** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
