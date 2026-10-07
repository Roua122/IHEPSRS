# TASK-PUB-002 — DOI uniqueness/mapping

Status: DONE
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.12, 10
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-028 — المنشورات**: تسجيل المنشورات وربطها بالباحثين والمشاريع والتحقق من المعرّفات عند توفرها. (Priority: Must; Test: TC-FR-028)

## Business Rules
- **BR-025**: DOI/ExternalPublicationId يعرّف Publication واحدًا Canonical. تكرار نفس DOI لا ينشئ منشورًا ثانيًا؛ يربط مؤلفون/انتماءات إضافية بالمنشور نفسه. ORCID فريد للشخص بعد التحقق لكنه لا يمنع ملفات خارجية غير موثقة. (Test: TC-BR-025)

## Use Cases
- **UC-12 — تسجيل منشور علمي والتحقق منه** — Acceptance: لا ينشأ سجلان مع DOI موثق متطابق.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **DOI uniqueness/mapping** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
- [x] Implemented according to `Implementation` classification.
- [x] Source IDs referenced in code/tests/PR where relevant.
- [x] Required validation/state rules enforced.
- [x] Authorization/scope checked.
- [x] Audit/observability handled where required.
- [x] Tests pass.
- [x] No secrets committed.
- [x] Documentation affected by the change updated.
- [x] No new business rule/status/field ownership introduced without CR/ADR as applicable.
