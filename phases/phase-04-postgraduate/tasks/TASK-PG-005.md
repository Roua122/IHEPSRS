# TASK-PG-005 — Enrollment lifecycle

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.6, 11, 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-013 — القيد الأكاديمي**: إنشاء Enrollment مع البرنامج والسنة والحالة بعد تحقق شروط القبول. (Priority: Must; Test: TC-FR-013)
- **FR-043 — إدارة سياسات قابلة للإصدار**: إدارة PolicyConfiguration حسب المؤسسة/البرنامج/الفوج مع effectiveFrom/effectiveTo/version وعدم تطبيق التغيير بأثر رجعي دون قرار. (Priority: Must; Test: TC-FR-043)
- **FR-045 — تاريخ الحالات واللقطات**: تسجيل StatusHistory للكيانات الحرجة ودعم Reporting Snapshot/As-of Date. (Priority: Must; Test: TC-FR-045)

## Business Rules
- **BR-003**: لا يمكن إنشاء قيد لطالب في برنامج غير فعال في تاريخ القيد. (Test: TC-BR-003)
- **BR-008**: إنشاء Enrollment يتطلب قرار قبول صالحًا مرتبطًا بنفس person/program/cycle. إذا أصبح البرنامج غير فعال قبل startDate فلا يُنشأ Active enrollment تلقائيًا؛ يدخل PendingValidation حتى قرار تحويل لنسخة/برنامج صالح أو إلغاء القرار مع السبب. (Test: TC-BR-008)
- **BR-009**: لا يملك الطالب أكثر من قيد فعال واحد لنفس البرنامج في المؤسسة نفسها إلا بإعفاء موثق. (Test: TC-BR-009)
- **BR-052**: الحد الأقصى لمدة الدراسة وعدد/مدة التمديدات يحددان في PolicyConfiguration لكل program/cohort. النظام يمنع تجاوز السياسة إلا عبر Exception قرار مسجل. (Test: TC-BR-052)
- **BR-053**: Freeze/Suspension، Withdrawal، Re-enrollment، Program Change عمليات مستقلة بقرارات وحالات تاريخية؛ لا تعدل Enrollment القديم لتبدو العملية وكأنها لم تحدث. (Test: TC-BR-053)
- **BR-054**: منح الدرجة يتطلب Enrollment مؤهلًا، استكمال ProgramRequirements، Thesis Approved عندما thesisRequired=true، وعدم وجود Holds إلزامية. DegreeDecision سجل مستقل ونهائي تشغيليًا. (Test: TC-BR-054)
- **BR-062**: الإعدادات التنظيمية (مدة دراسة، عبء، لجنة، متطلبات، Retention) Versioned وEffective-dated؛ السجلات القائمة تحتفظ policyVersion المطبق وقت القرار. (Test: TC-BR-062)

## Use Cases
- **UC-06 — إنشاء القيد وتعيين المشرف** — Acceptance: تاريخ كل مشرف محفوظ ولا يكتب فوق السابق.
- **UC-21 — تعليق/انسحاب/استكمال القيد** — Acceptance: الحالة التاريخية محفوظة ولا يوجد قيد فعال متعارض.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-021 — الزمن**: تخزين الطوابع الزمنية بصيغة موحدة UTC مع عرضها وفق المنطقة الزمنية للمستخدم/المؤسسة. (Verification: TC-NFR-021 / section 18.1.1)

## Goal
تنفيذ **Enrollment lifecycle** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
