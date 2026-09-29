# TASK-RPT-003 — Basic dashboards

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: أمة الرحمن فواد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 15
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-032 — لوحات المعلومات**: عرض مؤشرات ملخصة حسب نطاق المستخدم والمؤسسة والفترة. (Priority: Should; Test: TC-FR-032)
- **FR-033 — التقارير**: إنتاج تقارير تشغيلية وإدارية قابلة للتصفية والتصدير. (Priority: Must; Test: TC-FR-033)

## Business Rules
- **BR-035**: التقارير تحترم نفس قيود الوصول المطبقة على البيانات التشغيلية. (Test: TC-BR-035)

## Use Cases
- **UC-14 — إنتاج تقرير أو لوحة مؤشرات** — Acceptance: الأرقام تتطابق مع تعريف المؤشر ومصدر البيانات المحددين.

## Non-Functional Requirements
- **NFR-001 — الأداء**: عمليات الواجهة القياسية (Login، Search، Save Draft، View Record، Update Metadata) تحقق P95 ≤ 3s من المتصفح إلى الاستجابة تحت Profile Load المحدد في القسم 17؛ لا يشمل رفع الملفات أو التقارير الثقيلة. (Verification: TC-NFR-001 / section 18.1.1)
- **NFR-018 — سهولة الاستخدام**: العمليات الرئيسية قابلة للتنفيذ دون تدريب تقني، مع رسائل خطأ مفهومة وإرشادات للحقول الإلزامية. (Verification: TC-NFR-018 / section 18.1.1)

## Goal
تنفيذ **Basic dashboards** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
