# TASK-INT-005 — Retry/failure/quarantine

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: أمة الرحمن فواد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 13.4, 14.7
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-035 — مراقبة التكامل**: عرض حالات رسائل التكامل والنجاح والفشل والزمن والنظام المصدر. (Priority: Must; Test: TC-FR-035)
- **FR-036 — إعادة المعالجة**: إعادة محاولة الرسائل الفاشلة آليًا أو يدويًا دون إنشاء تكرار. (Priority: Must; Test: TC-FR-036)
- **FR-048 — إدارة محاولات التكامل**: تسجيل IntegrationAttempt لكل محاولة معالجة مع الوقت والنتيجة والخطأ والـworker والمدة دون فقد الـpayload الأصلي المرجعي. (Priority: Must; Test: TC-FR-048)

## Business Rules
- **BR-032**: الفشل المؤقت في التكامل يعاد تلقائيًا؛ الفشل الدائم ينتقل إلى قائمة معالجة يدوية. (Test: TC-BR-032)

## Use Cases
- **UC-15 — معالجة رسالة تكامل فاشلة** — Acceptance: إعادة المعالجة بعد نجاح السبب تنتهي Succeeded دون نسخة سجل إضافية.

## Non-Functional Requirements
- **NFR-006 — الاعتمادية**: فشل أي تكامل خارجي لا يؤدي إلى توقف وظائف المنصة غير المعتمدة عليه. (Verification: TC-NFR-006 / section 18.1.1)
- **NFR-017 — الرصد**: Observability إلزامي: structured logs، metrics، traces/correlationId، health checks، dashboards وalerts وفق القسم 14.7. (Verification: TC-NFR-017 / section 18.1.1)
- **NFR-036 — المراقبة التشغيلية**: قياس request rate/error rate/latency/queue depth/retry/quarantine/freshness/storage، وفصل Application/Security/Audit/Integration logs مع سياسات احتفاظ. (Verification: TC-NFR-036 / section 18.1.1)

## Goal
تنفيذ **Retry/failure/quarantine** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
