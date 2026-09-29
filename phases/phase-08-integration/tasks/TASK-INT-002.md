# TASK-INT-002 — Canonical envelope

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: خلود مهيب

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 13.3
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-034 — واجهات التكامل**: توفير واستقبال APIs/Events/Batch وفق عقود موثقة وإصدارات مستقرة. (Priority: Must; Test: TC-FR-034)
- **FR-048 — إدارة محاولات التكامل**: تسجيل IntegrationAttempt لكل محاولة معالجة مع الوقت والنتيجة والخطأ والـworker والمدة دون فقد الـpayload الأصلي المرجعي. (Priority: Must; Test: TC-FR-048)

## Business Rules
- **BR-029**: كل رسالة تكامل واردة تحمل sourceSystem وexternalId وeventTime أو ما يعادلهما. (Test: TC-BR-029)
- **BR-037**: الوقت الرسمي للحدث هو طابع النظام المسؤول عن الحدث مع الاحتفاظ بطابع الاستلام للتكامل. (Test: TC-BR-037)
- **BR-056**: الرسالة الأقدم من lastProcessedSourceVersion/eventTime لا تكتب فوق بيانات أحدث؛ تسجل StaleIgnored. DuplicateIgnored وStaleIgnored نتائج معالجة مستقلة وليستا فشلًا تقنيًا. (Test: TC-BR-056)

## Use Cases
- **UC-03 — مزامنة طالب من نظام الجامعة** — Acceptance: إعادة إرسال نفس الرسالة لا تنشئ طالبًا إضافيًا؛ الخطأ يظهر في شاشة التكامل.
- **UC-15 — معالجة رسالة تكامل فاشلة** — Acceptance: إعادة المعالجة بعد نجاح السبب تنتهي Succeeded دون نسخة سجل إضافية.

## Non-Functional Requirements
- **NFR-015 — منع التكرار**: Message Identity منفصلة عن Business Identity. منع إعادة تطبيق الرسالة يعتمد افتراضيًا على (sourceSystem,messageId) أو idempotencyKey غير قابل لإعادة الاستخدام، وليس externalId وحده. (Verification: TC-NFR-015 / section 18.1.1)
- **NFR-024 — الإصدارات**: عقود التكامل Versioned. Breaking change يتطلب major version جديد، فترة توافق لا تقل عن 90 يومًا في Baseline، واختبارات Contract قبل الإيقاف. (Verification: TC-NFR-024 / section 18.1.1)
- **NFR-032 — أمن APIs والتكامل**: كل نظام مصدر له هوية منفصلة ونطاق مؤسسة/Scopes؛ المصادقة عبر mTLS أو OAuth2 Client Credentials أو ما يعادلها؛ replay window افتراضي 5m؛ payload limits وrate limits لكل مصدر. (Verification: TC-NFR-032 / section 18.1.1)

## Goal
تنفيذ **Canonical envelope** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
