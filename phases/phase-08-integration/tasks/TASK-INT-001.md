# TASK-INT-001 — Integration system onboarding

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: خلود مهيب

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.20, 13
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-046 — تهيئة نظام تكامل**: Onboard IntegrationSystem وربطه بالمؤسسة والعقد والـMappings وAuth Profile واختبار الاتصال قبل Active. (Priority: Must; Test: TC-FR-046)

## Business Rules
- **BR-060**: IntegrationSystem المؤسسي يجب أن يحمل institutionId إلزاميًا، وتتحقق المنصة أن أي institution reference في payload يقع ضمن نفس النطاق؛ محاولة الكتابة لمؤسسة أخرى ترفض كـSEC-403 وتسجل SecurityEvent. (Test: TC-BR-060)

## Use Cases
- **UC-20 — تهيئة نظام تكامل جديد** — Acceptance: النظام لا يستطيع الكتابة خارج مؤسسته، وكل اتصال قابل للتتبع.

## Non-Functional Requirements
- **NFR-010 — إدارة الأسرار**: الأسرار لا تخزن داخل جداول الأعمال؛ تحفظ في Secrets/KMS مكافئ، وتدوّر Credentials التكامل الافتراضية كل ≤90 يومًا أو فور الاشتباه، مع إبطال فوري للمفتاح المخترق. (Verification: TC-NFR-010 / section 18.1.1)
- **NFR-024 — الإصدارات**: عقود التكامل Versioned. Breaking change يتطلب major version جديد، فترة توافق لا تقل عن 90 يومًا في Baseline، واختبارات Contract قبل الإيقاف. (Verification: TC-NFR-024 / section 18.1.1)
- **NFR-032 — أمن APIs والتكامل**: كل نظام مصدر له هوية منفصلة ونطاق مؤسسة/Scopes؛ المصادقة عبر mTLS أو OAuth2 Client Credentials أو ما يعادلها؛ replay window افتراضي 5m؛ payload limits وrate limits لكل مصدر. (Verification: TC-NFR-032 / section 18.1.1)

## Goal
تنفيذ **Integration system onboarding** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
