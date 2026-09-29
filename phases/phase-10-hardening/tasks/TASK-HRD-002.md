# TASK-HRD-002 — Accessibility verification

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: SHOULD
Owner: مرام وديع

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 14, 18
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- لا يوجد FR واحد مباشر؛ المهمة Cross-cutting/Design-enabling.

## Business Rules
- لا توجد BR مباشرة محددة لهذه المهمة؛ لا يجوز أن تتجاوز أي BR عامة ذات صلة.

## Use Cases
- لا توجد Use Case واحدة مباشرة؛ المهمة داعمة لعدة تدفقات.

## Non-Functional Requirements
- **NFR-019 — إتاحة الواجهة**: دعم العربية RTL والإنجليزية، والوظائف الأساسية تحقق WCAG 2.2 AA: keyboard navigation، focus visible، labels، contrast، screen-reader semantics، accessible errors/tables. (Verification: TC-NFR-019 / section 18.1.1)
- **NFR-035 — إمكانية الوصول Accessibility**: الواجهات الأساسية تحقق WCAG 2.2 AA وتشمل keyboard-only، screen reader labels، focus management، contrast، accessible validation، semantic tables، وعدم الاعتماد على اللون وحده. (Verification: TC-NFR-035 / section 18.1.1)

## Goal
تنفيذ **Accessibility verification** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
