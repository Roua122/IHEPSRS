# TASK-PG-004 — Admission decision

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 4

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.5
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-012 — قرار القبول**: إصدار قبول أو رفض أو قبول مشروط مع سبب القرار وتاريخه. (Priority: Must; Test: TC-FR-012)

## Business Rules
- **BR-007**: كل قرار رفض/إعادة للاستكمال يجب أن يتضمن سببًا. (Test: TC-BR-007)
- **BR-008**: إنشاء Enrollment يتطلب قرار قبول صالحًا مرتبطًا بنفس person/program/cycle. إذا أصبح البرنامج غير فعال قبل startDate فلا يُنشأ Active enrollment تلقائيًا؛ يدخل PendingValidation حتى قرار تحويل لنسخة/برنامج صالح أو إلغاء القرار مع السبب. (Test: TC-BR-008)

## Use Cases
- **UC-05 — مراجعة واتخاذ قرار طلب الدراسات العليا** — Acceptance: كل رفض يحمل سببًا؛ لا ينشأ قيد من طلب غير مقبول.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Admission decision** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
