# TASK-PUB-001 — Publication registry

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.12, 10, 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-028 — المنشورات**: تسجيل المنشورات وربطها بالباحثين والمشاريع والتحقق من المعرّفات عند توفرها. (Priority: Must; Test: TC-FR-028)

## Business Rules
- **BR-024**: كل منشور يرتبط بباحث واحد على الأقل، ويمكن ربطه بمشروع أو رسالة عند وجود علاقة. (Test: TC-BR-024)
- **BR-025**: DOI/ExternalPublicationId يعرّف Publication واحدًا Canonical. تكرار نفس DOI لا ينشئ منشورًا ثانيًا؛ يربط مؤلفون/انتماءات إضافية بالمنشور نفسه. ORCID فريد للشخص بعد التحقق لكنه لا يمنع ملفات خارجية غير موثقة. (Test: TC-BR-025)
- **BR-048**: PublicationAuthor.authorOrder فريد داخل Publication ويبدأ من 1. لكل مؤلف يجب affiliationOrgUnitId أو affiliationText. correspondingAuthor غير إلزامي وقد يكون أكثر من واحد. المؤلف الخارجي يمكن ربطه لاحقًا بـResearcher دون إنشاء Publication جديد. (Test: TC-BR-048)

## Use Cases
- **UC-12 — تسجيل منشور علمي والتحقق منه** — Acceptance: لا ينشأ سجلان مع DOI موثق متطابق.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Publication registry** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
