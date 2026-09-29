# TASK-HRD-005 — Disaster recovery readiness

Status: TODO
Implementation: DOCUMENTATION_ONLY
Prototype Priority: N/A
Owner: Member 7

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 17.1
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- لا يوجد FR واحد مباشر؛ المهمة Cross-cutting/Design-enabling.

## Business Rules
- لا توجد BR مباشرة محددة لهذه المهمة؛ لا يجوز أن تتجاوز أي BR عامة ذات صلة.

## Use Cases
- لا توجد Use Case واحدة مباشرة؛ المهمة داعمة لعدة تدفقات.

## Non-Functional Requirements
- **NFR-005 — التوافر**: الخدمات الأساسية (Authentication, Registry, Postgraduate, Thesis, Research, Integration Intake) تحقق 99.5% شهريًا باستثناء الصيانة المعتمدة. Reporting الثقيلة لا تدخل في نفس SLO. (Verification: TC-NFR-005 / section 18.1.1)
- **NFR-012 — النسخ الاحتياطي**: RPO للخدمات التشغيلية والتدقيق ≤1 ساعة. قواعد البيانات تدعم Point-in-Time Recovery؛ النسخ الكاملة يومية، وسجلات/نسخ تزايدية كل ≤15 دقيقة حيث تدعم التقنية. (Verification: TC-NFR-012 / section 18.1.1)
- **NFR-013 — الاستعادة**: RTO للخدمات الأساسية ≤2 ساعة في سيناريو البنية المخطط؛ Reporting/Analytics ≤8 ساعات. الهدف متوافق مع SLO 99.5% عند إدارة الحوادث. (Verification: TC-NFR-013 / section 18.1.1)
- **NFR-037 — التعافي من الكوارث**: نسخ مشفرة خارج موقع/منطقة التشغيل يوميًا، Restore test ربع سنوي، Runbook مع صلاحية إعلان الكارثة والتعافي والتحقق بعد الاستعادة. (Verification: TC-NFR-037 / section 18.1.1)

## Goal
تنفيذ **Disaster recovery readiness** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
