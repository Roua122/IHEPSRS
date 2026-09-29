# TASK-TH-002 — Supervisor assignment rules

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: دعاء عبد الواحد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.6, 10, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-014 — إدارة المشرفين**: ترشيح المشرفين والتحقق من الأهلية والعبء واعتماد التعيين والتغيير. (Priority: Must; Test: TC-FR-014)

## Business Rules
- **BR-011**: كل رسالة فعالة يجب أن يكون لها مشرف رئيسي معتمد قبل انتقالها إلى In Progress. (Test: TC-BR-011)
- **BR-012**: تغيير المشرف لا يحذف السجل السابق؛ ينهي التعيين السابق وينشئ تعيينًا جديدًا. (Test: TC-BR-012)
- **BR-043**: يوجد Main Supervisor فعال واحد فقط لكل Thesis. لا تتداخل فترات Main Supervisor. endDate≥startDate. لا يجوز أن يكون المشرف هو Person الطالب. كل تغيير يتطلب changeReason وapprovedByUserId ويحفظ السابق. (Test: TC-BR-043)
- **BR-044**: العبء الإشرافي يحسب من التعيينات Active: Main=1.0، Co-supervisor=0.5 كنقاط Baseline. حد Prototype الافتراضي 5 نقاط لكل مشرف، ويجوز ضبطه حسب الرتبة/البرنامج عبر PolicyConfiguration دون أثر رجعي. (Test: TC-BR-044)

## Use Cases
- **UC-06 — إنشاء القيد وتعيين المشرف** — Acceptance: تاريخ كل مشرف محفوظ ولا يكتب فوق السابق.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Supervisor assignment rules** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
