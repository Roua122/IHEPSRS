# TASK-RS-003 — Project lifecycle

Status: DONE
Implementation: IMPLEMENT
Prototype Priority: SHOULD
Owner: سمية خالد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.11, 10, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-024 — المشروع البحثي**: إنشاء المشروع بعد الاعتماد وإدارة الفترة والحالة والمخرجات. (Priority: Must; Test: TC-FR-024)
- **FR-027 — المخرجات البحثية**: تسجيل المخرجات والنتائج والبيانات البحثية القابلة للفهرسة. (Priority: Should; Test: TC-FR-027)

## Business Rules
- **BR-020**: كل مشروع بحثي معتمد له قائد مسؤول واحد على الأقل وفترة زمنية محددة. (Test: TC-BR-020)
- **BR-049**: ResearchProposal Approved ينشئ Project واحدًا افتراضيًا. مشروع بلا Proposal مسموح فقط بإنشاء إداري مخول مع reason/decision. أي علاقة 1:N تحتاج Change Request على السياسة. (Test: TC-BR-049)
- **BR-050**: تغيير Project Leader أو نطاق/مدة المشروع بعد التفعيل يتطلب AmendmentRequest وقرار RA؛ لا يستبدل التاريخ السابق. (Test: TC-BR-050)

## Use Cases
- **UC-11 — إدارة مشروع بحثي وتمويله ومخرجاته** — Acceptance: لا يصبح Completed قبل اكتمال الحقول/المخرجات الإلزامية المهيأة.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)

## Goal
تنفيذ **Project lifecycle** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
