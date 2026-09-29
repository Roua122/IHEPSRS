# TASK-HRD-003 — Performance/capacity verification

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: SHOULD
Owner: Member 7

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 17, 18.1.1
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- لا يوجد FR واحد مباشر؛ المهمة Cross-cutting/Design-enabling.

## Business Rules
- لا توجد BR مباشرة محددة لهذه المهمة؛ لا يجوز أن تتجاوز أي BR عامة ذات صلة.

## Use Cases
- لا توجد Use Case واحدة مباشرة؛ المهمة داعمة لعدة تدفقات.

## Non-Functional Requirements
- **NFR-001 — الأداء**: عمليات الواجهة القياسية (Login، Search، Save Draft، View Record، Update Metadata) تحقق P95 ≤ 3s من المتصفح إلى الاستجابة تحت Profile Load المحدد في القسم 17؛ لا يشمل رفع الملفات أو التقارير الثقيلة. (Verification: TC-NFR-001 / section 18.1.1)
- **NFR-002 — استجابة API**: واجهات CRUD الداخلية القياسية تحقق P95 ≤ 1.5s عند قياسها على بوابة API دون زمن انتظار نظام خارجي؛ الواجهات المعتمدة على نظام خارجي لها Budget مستقل موثق في عقد التكامل. (Verification: TC-NFR-002 / section 18.1.1)
- **NFR-003 — السعة**: Design Baseline مفصول حسب النوع: 150K طلب/قيد دراسات عليا تاريخي/نشط، 100K باحث/عضو هيئة تدريس، 250K رسالة، 200K مقترح/مشروع بحثي، 1.5M منشور/مخرج بحثي، و5M سجل Document metadata. هذه افتراضات تصميم وليست إحصاءات رسمية عن اليمن. (Verification: TC-NFR-003 / section 18.1.1)
- **NFR-004 — التزامن**: دعم 2,000 مستخدم متزامن في الذروة مع قابلية التوسع أفقيًا إلى 5,000 دون تغيير منطقي في النظام. (Verification: TC-NFR-004 / section 18.1.1)
- **NFR-005 — التوافر**: الخدمات الأساسية (Authentication, Registry, Postgraduate, Thesis, Research, Integration Intake) تحقق 99.5% شهريًا باستثناء الصيانة المعتمدة. Reporting الثقيلة لا تدخل في نفس SLO. (Verification: TC-NFR-005 / section 18.1.1)
- **NFR-006 — الاعتمادية**: فشل أي تكامل خارجي لا يؤدي إلى توقف وظائف المنصة غير المعتمدة عليه. (Verification: TC-NFR-006 / section 18.1.1)
- **NFR-007 — القابلية للتوسع**: يمكن إضافة مؤسسة جديدة عبر إعدادات وتعيين Adapter/credentials دون تغيير الوحدات الأساسية. (Verification: TC-NFR-007 / section 18.1.1)

## Goal
تنفيذ **Performance/capacity verification** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
