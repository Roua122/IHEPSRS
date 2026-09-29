# TASK-TH-008 — Final approval/archive

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 5

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.9, 9.18, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-020 — اعتماد الدرجة**: توثيق القرار النهائي وربط الرسالة بالدرجة وتاريخ المنح. (Priority: Must; Test: TC-FR-020)
- **FR-040 — الأرشفة**: أرشفة السجلات النهائية ومنع التعديل المباشر عليها مع الاحتفاظ بإمكانية القراءة والتتبع. (Priority: Must; Test: TC-FR-040)
- **FR-045 — تاريخ الحالات واللقطات**: تسجيل StatusHistory للكيانات الحرجة ودعم Reporting Snapshot/As-of Date. (Priority: Must; Test: TC-FR-045)

## Business Rules
- **BR-019**: اعتماد الدرجة نهائي تشغيليًا؛ أي تصحيح لاحق يتم بعملية Amendment لا بتعديل مباشر. (Test: TC-BR-019)
- **BR-026**: لا يحذف سجل له أثر أكاديمي/بحثي معتمد حذفًا ماديًا؛ يستخدم التعطيل أو الأرشفة. (Test: TC-BR-026)
- **BR-054**: منح الدرجة يتطلب Enrollment مؤهلًا، استكمال ProgramRequirements، Thesis Approved عندما thesisRequired=true، وعدم وجود Holds إلزامية. DegreeDecision سجل مستقل ونهائي تشغيليًا. (Test: TC-BR-054)
- **BR-059**: Retention يحدد لكل Domain. لا Hard Delete للسجلات الأكاديمية المعتمدة؛ مسودات/بيانات تشغيل مؤقتة قد تحذف/تُخفى وفق Retention. انتهاء الاحتفاظ قد ينتج Anonymization بدل الحذف إذا لزم الحفاظ على الإحصاء. (Test: TC-BR-059)

## Use Cases
- **UC-09 — تسجيل نتيجة المناقشة واعتماد الرسالة** — Acceptance: لا يمكن Approved مع Corrections مفتوحة.
- **UC-18 — أرشفة سجل نهائي** — Acceptance: لا يمكن تحرير سجل مؤرشف إلا بعملية استثنائية موثقة إن سمحت السياسة.

## Non-Functional Requirements
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Final approval/archive** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
