# TASK-PG-003 — Review and NeedMoreInfo

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 4

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
