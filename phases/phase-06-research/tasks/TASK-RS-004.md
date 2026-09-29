# TASK-RS-004 — Members/leader changes

Status: TODO
Implementation: DOCUMENTATION_ONLY
Prototype Priority: N/A
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.11, 10
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-025 — فريق البحث**: إدارة أعضاء الفريق وأدوارهم وانتماءاتهم خلال مدة المشروع. (Priority: Should; Test: TC-FR-025)

## Business Rules
- **BR-020**: كل مشروع بحثي معتمد له قائد مسؤول واحد على الأقل وفترة زمنية محددة. (Test: TC-BR-020)
- **BR-050**: تغيير Project Leader أو نطاق/مدة المشروع بعد التفعيل يتطلب AmendmentRequest وقرار RA؛ لا يستبدل التاريخ السابق. (Test: TC-BR-050)

## Use Cases
- **UC-11 — إدارة مشروع بحثي وتمويله ومخرجاته** — Acceptance: لا يصبح Completed قبل اكتمال الحقول/المخرجات الإلزامية المهيأة.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)

## Goal
تنفيذ **Members/leader changes** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
