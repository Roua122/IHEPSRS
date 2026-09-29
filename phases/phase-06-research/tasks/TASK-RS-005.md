# TASK-RS-005 — Funding metadata/amendments

Status: TODO
Implementation: DOCUMENTATION_ONLY
Prototype Priority: N/A
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.11, 10
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-026 — التمويل**: تسجيل مصادر التمويل والمبالغ والدفعات وربطها بالمشروع دون استبدال النظام المالي. (Priority: Should; Test: TC-FR-026)

## Business Rules
- **BR-023**: قيمة التمويل المسجلة في المنصة معلومات مرجعية، والنظام المالي هو المصدر الرسمي للحركة المالية عند التكامل. (Test: TC-BR-023)
- **BR-051**: تعديل Budget/Funding بعد الاعتماد ينشئ Budget Amendment/ FundingRecord version ويحتاج موافقة مخولة؛ Finance يبقى مصدر الحقيقة للحركة المالية الفعلية. (Test: TC-BR-051)

## Use Cases
- **UC-11 — إدارة مشروع بحثي وتمويله ومخرجاته** — Acceptance: لا يصبح Completed قبل اكتمال الحقول/المخرجات الإلزامية المهيأة.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Funding metadata/amendments** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
