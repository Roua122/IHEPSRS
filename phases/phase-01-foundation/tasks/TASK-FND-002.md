# TASK-FND-002 — Environment/config strategy

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 1

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 20.2
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-038 — إدارة الإعدادات**: إدارة الإعدادات التشغيلية القابلة للتغيير دون تعديل الكود مثل المدد وحدود الملفات. (Priority: Should; Test: TC-FR-038)

## Business Rules
- **BR-038**: لا تغير سياسة أعمال تاريخية نتيجة تعديل إعداد جديد؛ السجل يحفظ القيم المؤثرة وقت تنفيذ القرار عند الحاجة. (Test: TC-BR-038)
- **BR-062**: الإعدادات التنظيمية (مدة دراسة، عبء، لجنة، متطلبات، Retention) Versioned وEffective-dated؛ السجلات القائمة تحتفظ policyVersion المطبق وقت القرار. (Test: TC-BR-062)

## Use Cases
- لا توجد Use Case واحدة مباشرة؛ المهمة داعمة لعدة تدفقات.

## Non-Functional Requirements
- **NFR-010 — إدارة الأسرار**: الأسرار لا تخزن داخل جداول الأعمال؛ تحفظ في Secrets/KMS مكافئ، وتدوّر Credentials التكامل الافتراضية كل ≤90 يومًا أو فور الاشتباه، مع إبطال فوري للمفتاح المخترق. (Verification: TC-NFR-010 / section 18.1.1)
- **NFR-016 — قابلية الصيانة**: الوحدات ذات حدود واضحة وعقود مستقرة، مع عدم الوصول المباشر بين قواعد بيانات الأنظمة الخارجية والمنصة. (Verification: TC-NFR-016 / section 18.1.1)
- **NFR-024 — الإصدارات**: عقود التكامل Versioned. Breaking change يتطلب major version جديد، فترة توافق لا تقل عن 90 يومًا في Baseline، واختبارات Contract قبل الإيقاف. (Verification: TC-NFR-024 / section 18.1.1)

## Goal
تنفيذ **Environment/config strategy** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
