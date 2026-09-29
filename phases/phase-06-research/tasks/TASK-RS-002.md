# TASK-RS-002 — Research proposal

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: SHOULD
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.10, 10, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-022 — المقترح البحثي**: إنشاء مقترح بحثي وفريق وميزانية أولية وإرساله للمراجعة. (Priority: Must; Test: TC-FR-022)
- **FR-023 — تحكيم المقترحات**: إسناد المحكمين وتسجيل التقييمات والقرار ومنع تضارب المصالح. (Priority: Must; Test: TC-FR-023)

## Business Rules
- **BR-021**: قرار المقترح البحثي لا يصدر من الباحث مقدم المقترح. (Test: TC-BR-021)
- **BR-022**: يجب تسجيل تضارب المصالح ومنع المحكم المتعارض من استكمال التقييم. (Test: TC-BR-022)
- **BR-049**: ResearchProposal Approved ينشئ Project واحدًا افتراضيًا. مشروع بلا Proposal مسموح فقط بإنشاء إداري مخول مع reason/decision. أي علاقة 1:N تحتاج Change Request على السياسة. (Test: TC-BR-049)
- **BR-061**: قرار تضارب المصالح يعتمد PolicyConfiguration ويغطي على الأقل: self-review، علاقة إشراف مباشرة، عضوية نفس المشروع/تأليف حديث حسب الفترة، وقرابة/تعارض معلن لا يمكن أتمتته؛ الإفصاح اليدوي إلزامي. (Test: TC-BR-061)

## Use Cases
- **UC-10 — إنشاء وتقييم مقترح بحثي** — Acceptance: لا يستطيع مقدم المقترح تحكيمه أو اعتماد القرار منفردًا.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Research proposal** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
