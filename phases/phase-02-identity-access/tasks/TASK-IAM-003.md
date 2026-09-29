# TASK-IAM-003 — Scope-aware authorization

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رؤى محمد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 14.1, 14.2
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-003 — الصلاحيات RBAC**: تطبيق الأدوار والصلاحيات على مستوى الوظيفة والمؤسسة ونطاق البيانات. (Priority: Must; Test: TC-FR-003)
- **FR-037 — سجل التدقيق**: تسجيل العمليات الحساسة مع المستخدم والوقت والقيمة السابقة والجديدة عند الحاجة. (Priority: Must; Test: TC-FR-037)

## Business Rules
- **BR-027**: المستخدم يرى فقط المؤسسات والكيانات الداخلة في نطاق صلاحياته. (Test: TC-BR-027)
- **BR-035**: التقارير تحترم نفس قيود الوصول المطبقة على البيانات التشغيلية. (Test: TC-BR-035)

## Use Cases
- **UC-01 — تسجيل الدخول والوصول الآمن** — Acceptance: لا يستطيع مستخدم معطل الدخول؛ المستخدم الصحيح يصل فقط للوظائف المصرح بها.
- **UC-13 — البحث الموحد وعرض الملف** — Acceptance: المستخدم في جامعة A لا يرى تفاصيل جامعة B إلا إذا كان دوره يسمح.
- **UC-17 — إدارة الصلاحيات المؤسسية** — Acceptance: لا يستطيع مدير مفوض منح صلاحية غير موجودة ضمن delegation الخاص به.

## Non-Functional Requirements
- **NFR-008 — الأمان**: TLS 1.2+ أو ما يعادله لجميع الاتصالات، Authorization على كل طلب، Least Privilege، ورفض افتراضي Deny-by-default. (Verification: TC-NFR-008 / section 18.1.1)
- **NFR-025 — الخصوصية**: تصنيف البيانات وData Minimization إلزاميان؛ الحقول الحساسة مشفرة عند التخزين، Masked في العرض/السجل، ولا تظهر في logs أو notifications. (Verification: TC-NFR-025 / section 18.1.1)

## Goal
تنفيذ **Scope-aware authorization** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
