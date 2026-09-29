# TASK-FND-004 — Logging and correlation baseline

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 1

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 14.7, 16
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-037 — سجل التدقيق**: تسجيل العمليات الحساسة مع المستخدم والوقت والقيمة السابقة والجديدة عند الحاجة. (Priority: Must; Test: TC-FR-037)
- **FR-048 — إدارة محاولات التكامل**: تسجيل IntegrationAttempt لكل محاولة معالجة مع الوقت والنتيجة والخطأ والـworker والمدة دون فقد الـpayload الأصلي المرجعي. (Priority: Must; Test: TC-FR-048)

## Business Rules
- **BR-033**: أي تغيير في بيانات Master Data الحساسة يسجل في Audit Log. (Test: TC-BR-033)
- **BR-037**: الوقت الرسمي للحدث هو طابع النظام المسؤول عن الحدث مع الاحتفاظ بطابع الاستلام للتكامل. (Test: TC-BR-037)

## Use Cases
- **UC-15 — معالجة رسالة تكامل فاشلة** — Acceptance: إعادة المعالجة بعد نجاح السبب تنتهي Succeeded دون نسخة سجل إضافية.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-017 — الرصد**: Observability إلزامي: structured logs، metrics، traces/correlationId، health checks، dashboards وalerts وفق القسم 14.7. (Verification: TC-NFR-017 / section 18.1.1)
- **NFR-036 — المراقبة التشغيلية**: قياس request rate/error rate/latency/queue depth/retry/quarantine/freshness/storage، وفصل Application/Security/Audit/Integration logs مع سياسات احتفاظ. (Verification: TC-NFR-036 / section 18.1.1)

## Goal
تنفيذ **Logging and correlation baseline** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
