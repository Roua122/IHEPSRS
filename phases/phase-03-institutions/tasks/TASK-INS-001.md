# TASK-INS-001 — Institution registry

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 2

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-004 — سجل المؤسسات**: إدارة الجامعات والكليات والمراكز البحثية وحالات اعتمادها وبياناتها المرجعية. (Priority: Must; Test: TC-FR-004)

## Business Rules
- **BR-001**: لكل مؤسسة institutionId فريد وغير قابل لإعادة الاستخدام بعد الأرشفة. (Test: TC-BR-001)
- **BR-002**: كل كلية/قسم/برنامج يتبع مؤسسة فعالة واحدة ضمن الفترة الزمنية المحددة. (Test: TC-BR-002)
- **BR-033**: أي تغيير في بيانات Master Data الحساسة يسجل في Audit Log. (Test: TC-BR-033)

## Use Cases
- **UC-02 — إدارة مؤسسة وهيكلها الأكاديمي** — Acceptance: لا يمكن إنشاء برنامج دون مؤسسة/قسم صالحين ولا حذف قيمة مرتبطة بسجل معتمد.

## Non-Functional Requirements
- **NFR-007 — القابلية للتوسع**: يمكن إضافة مؤسسة جديدة عبر إعدادات وتعيين Adapter/credentials دون تغيير الوحدات الأساسية. (Verification: TC-NFR-007 / section 18.1.1)
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Institution registry** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
