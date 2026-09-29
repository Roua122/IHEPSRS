# TASK-INT-004 — Stale message protection

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: SHOULD
Owner: خلود مهيب

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 13
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-009 — مزامنة الطلاب**: استقبال تحديثات الطلاب من أنظمة الجامعات والتحقق منها ومنع التكرار وتسجيل النتيجة. (Priority: Must; Test: TC-FR-009)
- **FR-034 — واجهات التكامل**: توفير واستقبال APIs/Events/Batch وفق عقود موثقة وإصدارات مستقرة. (Priority: Must; Test: TC-FR-034)
- **FR-035 — مراقبة التكامل**: عرض حالات رسائل التكامل والنجاح والفشل والزمن والنظام المصدر. (Priority: Must; Test: TC-FR-035)

## Business Rules
- **BR-031**: التعارض يحسم أولًا بملكية الحقل Field-Level Source of Truth. إذا تعذر الحسم أو ظهرت Race/انقطاع طويل ينشأ DataConflict ولا يتم overwrite صامتًا. (Test: TC-BR-031)
- **BR-056**: الرسالة الأقدم من lastProcessedSourceVersion/eventTime لا تكتب فوق بيانات أحدث؛ تسجل StaleIgnored. DuplicateIgnored وStaleIgnored نتائج معالجة مستقلة وليستا فشلًا تقنيًا. (Test: TC-BR-056)

## Use Cases
- **UC-03 — مزامنة طالب من نظام الجامعة** — Acceptance: إعادة إرسال نفس الرسالة لا تنشئ طالبًا إضافيًا؛ الخطأ يظهر في شاشة التكامل.

## Non-Functional Requirements
- **NFR-015 — منع التكرار**: Message Identity منفصلة عن Business Identity. منع إعادة تطبيق الرسالة يعتمد افتراضيًا على (sourceSystem,messageId) أو idempotencyKey غير قابل لإعادة الاستخدام، وليس externalId وحده. (Verification: TC-NFR-015 / section 18.1.1)

## Goal
تنفيذ **Stale message protection** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
