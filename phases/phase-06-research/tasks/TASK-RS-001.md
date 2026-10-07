# TASK-RS-001 — Researcher profile

Status: DONE
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.10, 12
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-021 — ملف الباحث**: إدارة الملف العلمي والانتماءات والتخصصات والمعرفات الخارجية والمنشورات. (Priority: Must; Test: TC-FR-021)
- **FR-042 — حل هوية الشخص ودمج التكرار**: مطابقة الأشخاص عبر identifiers موثوقة وExternalIdMapping وإتاحة Merge/Unmerge مضبوط لـData Steward مع Audit. (Priority: Must; Test: TC-FR-042)

## Business Rules
- **BR-055**: Person هو الجذر الواحد للهوية. نفس الشخص قد يملك Student/Researcher/UserAccount profiles متعددة. المطابقة تستخدم ExternalIdMapping ومعرفًا وطنيًا مشفرًا/HMAC عند توفره وتاريخ الميلاد/أدلة إضافية؛ الدمج يديره Data Steward. (Test: TC-BR-055)

## Use Cases
- **UC-10 — إنشاء وتقييم مقترح بحثي** — Acceptance: لا يستطيع مقدم المقترح تحكيمه أو اعتماد القرار منفردًا.
- **UC-23 — حل تكرار الشخص ودمج الهوية** — Acceptance: Person واحد يمثل الشخص، مع بقاء مراجع المصدر.

## Non-Functional Requirements
- **NFR-025 — الخصوصية**: تصنيف البيانات وData Minimization إلزاميان؛ الحقول الحساسة مشفرة عند التخزين، Masked في العرض/السجل، ولا تظهر في logs أو notifications. (Verification: TC-NFR-025 / section 18.1.1)

## Goal
تنفيذ **Researcher profile** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
