# TASK-PUB-004 — Affiliations at publication time

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: مرام وديع

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.12, 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-021 — ملف الباحث**: إدارة الملف العلمي والانتماءات والتخصصات والمعرفات الخارجية والمنشورات. (Priority: Must; Test: TC-FR-021)
- **FR-028 — المنشورات**: تسجيل المنشورات وربطها بالباحثين والمشاريع والتحقق من المعرّفات عند توفرها. (Priority: Must; Test: TC-FR-028)

## Business Rules
- **BR-048**: PublicationAuthor.authorOrder فريد داخل Publication ويبدأ من 1. لكل مؤلف يجب affiliationOrgUnitId أو affiliationText. correspondingAuthor غير إلزامي وقد يكون أكثر من واحد. المؤلف الخارجي يمكن ربطه لاحقًا بـResearcher دون إنشاء Publication جديد. (Test: TC-BR-048)
- **BR-055**: Person هو الجذر الواحد للهوية. نفس الشخص قد يملك Student/Researcher/UserAccount profiles متعددة. المطابقة تستخدم ExternalIdMapping ومعرفًا وطنيًا مشفرًا/HMAC عند توفره وتاريخ الميلاد/أدلة إضافية؛ الدمج يديره Data Steward. (Test: TC-BR-055)

## Use Cases
- **UC-12 — تسجيل منشور علمي والتحقق منه** — Acceptance: لا ينشأ سجلان مع DOI موثق متطابق.

## Non-Functional Requirements
- **NFR-025 — الخصوصية**: تصنيف البيانات وData Minimization إلزاميان؛ الحقول الحساسة مشفرة عند التخزين، Masked في العرض/السجل، ولا تظهر في logs أو notifications. (Verification: TC-NFR-025 / section 18.1.1)

## Goal
تنفيذ **Affiliations at publication time** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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

## Implementation progress — 2026-10-10
Implementation completed in the Member-02 completion package and covered by the combined source-linked `publications:check`. Status remains TODO until `pnpm quality`, regression checks, smoke, GitHub CI, and review are green on the target branch; then it may be changed to DONE. See `docs/47_publication_affiliation_external_linking.md` and `MEMBER_02_IMPLEMENTATION_REPORT_AR.md`.
