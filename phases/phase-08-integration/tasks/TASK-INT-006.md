# TASK-INT-006 — Legacy batch/file integration

Status: TODO
Implementation: DOCUMENTATION_ONLY
Prototype Priority: N/A
Owner: خلود مهيب

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 13.1.2
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-034 — واجهات التكامل**: توفير واستقبال APIs/Events/Batch وفق عقود موثقة وإصدارات مستقرة. (Priority: Must; Test: TC-FR-034)
- **FR-046 — تهيئة نظام تكامل**: Onboard IntegrationSystem وربطه بالمؤسسة والعقد والـMappings وAuth Profile واختبار الاتصال قبل Active. (Priority: Must; Test: TC-FR-046)

## Business Rules
- **BR-029**: كل رسالة تكامل واردة تحمل sourceSystem وexternalId وeventTime أو ما يعادلهما. (Test: TC-BR-029)
- **BR-030**: إذا أعيد إرسال نفس الرسالة دون تغيير، يجب ألا تنتج نسخة بيانات جديدة. (Test: TC-BR-030)

## Use Cases
- **UC-20 — تهيئة نظام تكامل جديد** — Acceptance: النظام لا يستطيع الكتابة خارج مؤسسته، وكل اتصال قابل للتتبع.

## Non-Functional Requirements
- **NFR-007 — القابلية للتوسع**: يمكن إضافة مؤسسة جديدة عبر إعدادات وتعيين Adapter/credentials دون تغيير الوحدات الأساسية. (Verification: TC-NFR-007 / section 18.1.1)
- **NFR-024 — الإصدارات**: عقود التكامل Versioned. Breaking change يتطلب major version جديد، فترة توافق لا تقل عن 90 يومًا في Baseline، واختبارات Contract قبل الإيقاف. (Verification: TC-NFR-024 / section 18.1.1)

## Goal
تنفيذ **Legacy batch/file integration** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
