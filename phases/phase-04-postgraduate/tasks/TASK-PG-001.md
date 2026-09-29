# TASK-PG-001 — Person/Applicant baseline

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 4

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-041 — إدارة المتقدم قبل القيد**: إنشاء/ربط Person للمتقدم حتى لو لم يكن له Student في SIS، ثم ربط Student لاحقًا عند القبول/المزامنة. (Priority: Must; Test: TC-FR-041)
- **FR-042 — حل هوية الشخص ودمج التكرار**: مطابقة الأشخاص عبر identifiers موثوقة وExternalIdMapping وإتاحة Merge/Unmerge مضبوط لـData Steward مع Audit. (Priority: Must; Test: TC-FR-042)

## Business Rules
- **BR-004**: معرف الطالب المركزي لا يستبدل معرف الطالب في الجامعة؛ يحتفظ النظام بكليهما مع المصدر. (Test: TC-BR-004)
- **BR-005**: بيانات الطالب الأكاديمية القادمة من SIS لا تعدل يدويًا إلا عبر آلية تصحيح موثقة ومصرح بها. (Test: TC-BR-005)
- **BR-055**: Person هو الجذر الواحد للهوية. نفس الشخص قد يملك Student/Researcher/UserAccount profiles متعددة. المطابقة تستخدم ExternalIdMapping ومعرفًا وطنيًا مشفرًا/HMAC عند توفره وتاريخ الميلاد/أدلة إضافية؛ الدمج يديره Data Steward. (Test: TC-BR-055)

## Use Cases
- **UC-04 — تقديم طلب دراسات عليا** — Acceptance: لا يقبل Submit مع متطلب إلزامي ناقص.
- **UC-23 — حل تكرار الشخص ودمج الهوية** — Acceptance: Person واحد يمثل الشخص، مع بقاء مراجع المصدر.

## Non-Functional Requirements
- **NFR-025 — الخصوصية**: تصنيف البيانات وData Minimization إلزاميان؛ الحقول الحساسة مشفرة عند التخزين، Masked في العرض/السجل، ولا تظهر في logs أو notifications. (Verification: TC-NFR-025 / section 18.1.1)

## Goal
تنفيذ **Person/Applicant baseline** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
