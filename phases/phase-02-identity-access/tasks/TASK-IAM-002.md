# TASK-IAM-002 — Role catalogue

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رؤى محمد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 4.3, 14
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-003 — الصلاحيات RBAC**: تطبيق الأدوار والصلاحيات على مستوى الوظيفة والمؤسسة ونطاق البيانات. (Priority: Must; Test: TC-FR-003)

## Business Rules
- **BR-027**: المستخدم يرى فقط المؤسسات والكيانات الداخلة في نطاق صلاحياته. (Test: TC-BR-027)
- **BR-028**: أي استثناء/تفويض يجب أن يكون محدد المدة والنطاق والسبب، ممثلاً في RoleDelegation، وينتهي تلقائيًا ولا يسمح بتفويض صلاحية لا يملكها المفوض. (Test: TC-BR-028)

## Use Cases
- **UC-17 — إدارة الصلاحيات المؤسسية** — Acceptance: لا يستطيع مدير مفوض منح صلاحية غير موجودة ضمن delegation الخاص به.
- **UC-24 — إنشاء تفويض مؤقت** — Acceptance: RoleDelegation تاريخي، محدود، قابل للتدقيق.

## Non-Functional Requirements
- **NFR-008 — الأمان**: TLS 1.2+ أو ما يعادله لجميع الاتصالات، Authorization على كل طلب، Least Privilege، ورفض افتراضي Deny-by-default. (Verification: TC-NFR-008 / section 18.1.1)
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)

## Goal
تنفيذ **Role catalogue** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
