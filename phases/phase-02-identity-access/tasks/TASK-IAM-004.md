# TASK-IAM-004 — Delegation model

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: SHOULD
Owner: مرام وديع

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 14
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-044 — إدارة التفويض المؤقت**: إنشاء RoleDelegation بمُفوِّض/مفوَّض له/نطاق/سبب/بداية/نهاية، مع auto-expiry/revocation. (Priority: Must; Test: TC-FR-044)

## Business Rules
- **BR-028**: أي استثناء/تفويض يجب أن يكون محدد المدة والنطاق والسبب، ممثلاً في RoleDelegation، وينتهي تلقائيًا ولا يسمح بتفويض صلاحية لا يملكها المفوض. (Test: TC-BR-028)
- **BR-058**: RoleDelegation ينتهي تلقائيًا عند endAt أو تعطيل أحد الحسابات أو إلغاء الدور الأصلي، أيهما أسبق؛ كل استخدام حساس للتفويض يسجل delegationId. (Test: TC-BR-058)

## Use Cases
- **UC-24 — إنشاء تفويض مؤقت** — Acceptance: RoleDelegation تاريخي، محدود، قابل للتدقيق.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-030 — إدارة الجلسة**: Admin/Sensitive: idle timeout 15m وmax session 8h. Regular users: idle 30m وmax 12h. Sensitive actions تتطلب re-authentication؛ logout/revocation يبطل الجلسة. (Verification: TC-NFR-030 / section 18.1.1)

## Goal
تنفيذ **Delegation model** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
