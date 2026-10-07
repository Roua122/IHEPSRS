# TASK-INS-002 — Organizational units

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: مرام وديع

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-005 — الهيكل الأكاديمي**: إدارة الكليات والأقسام والوحدات وربطها بالمؤسسات. (Priority: Must; Test: TC-FR-005)

## Business Rules
- **BR-002**: كل كلية/قسم/برنامج يتبع مؤسسة فعالة واحدة ضمن الفترة الزمنية المحددة. (Test: TC-BR-002)
- **BR-042**: لكل AcademicProgram وOrgUnit فترة فعالية effectiveFrom/effectiveTo؛ effectiveTo فارغ يعني مستمر. أي قرار يعتمد النسخة السارية في تاريخ الحدث ولا يغير التاريخ عند تحديث المرجع. (Test: TC-BR-042)

## Use Cases
- **UC-02 — إدارة مؤسسة وهيكلها الأكاديمي** — Acceptance: لا يمكن إنشاء برنامج دون مؤسسة/قسم صالحين ولا حذف قيمة مرتبطة بسجل معتمد.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Organizational units** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
