# TASK-TH-005 — Defense scheduling

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: دعاء عبد الواحد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.8, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-018 — لجنة المناقشة**: تكوين اللجنة وتحديد الأدوار والتحقق من عدم التعارض واعتمادها. (Priority: Must; Test: TC-FR-018)
- **FR-019 — المناقشة**: جدولة جلسة المناقشة وتسجيل النتيجة والتعديلات المطلوبة ومحضر القرار. (Priority: Must; Test: TC-FR-019)

## Business Rules
- **BR-015**: لا يمكن جدولة المناقشة قبل حالة Submitted واستكمال متطلبات اللجنة. (Test: TC-BR-015)
- **BR-016**: أعضاء لجنة المناقشة يجب ألا يكونوا مكررين ويجب توثيق الدور لكل عضو. (Test: TC-BR-016)

## Use Cases
- **UC-08 — تقديم الرسالة وتكوين لجنة المناقشة** — Acceptance: لا يمكن جدولة جلسة بلا لجنة مكتملة أو رسالة Submitted.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Defense scheduling** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
