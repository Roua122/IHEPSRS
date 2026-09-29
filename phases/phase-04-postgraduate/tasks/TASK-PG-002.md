# TASK-PG-002 — Application workflow

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رهف عادل

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 9.4, 10, 11
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-010 — طلب الدراسات العليا**: إنشاء طلب والتحقق من اكتماله وإرفاق الوثائق وتسليمه للمراجعة. (Priority: Must; Test: TC-FR-010)
- **FR-029 — إدارة الوثائق**: رفع وتصنيف وإصدار الوثائق والتحقق من النوع والحجم وربطها بالكيانات. (Priority: Must; Test: TC-FR-029)
- **FR-030 — الإشعارات**: إرسال إشعارات داخلية وبريدية للأحداث المهمة مع تتبع حالة الإرسال. (Priority: Should; Test: TC-FR-030)
- **FR-041 — إدارة المتقدم قبل القيد**: إنشاء/ربط Person للمتقدم حتى لو لم يكن له Student في SIS، ثم ربط Student لاحقًا عند القبول/المزامنة. (Priority: Must; Test: TC-FR-041)

## Business Rules
- **BR-006**: لا يصبح طلب الدراسات العليا Submitted ما لم تكتمل الحقول والوثائق الإلزامية وفق إعداد البرنامج. (Test: TC-BR-006)
- **BR-036**: ملفات الرسائل/المقترحات لا تستبدل بصمت؛ يحتفظ النظام برقم إصدار أو أثر التحديث. (Test: TC-BR-036)
- **BR-041**: NeedMoreInfo يطلبه Postgraduate Reviewer/Officer المخول فقط. يستطيع Applicant تعديل الحقول/الوثائق المحددة في الطلب فقط؛ تحتفظ المنصة بنسخة التقديم السابقة. firstSubmittedAt لا يتغير، وresubmittedAt يسجل كل إعادة؛ زمن NeedMoreInfo مستبعد من SLA القرار. (Test: TC-BR-041)
- **BR-057**: Document لا يحمل polymorphic ownerId مباشرًا. الربط يتم عبر DocumentLink مع targetType/targetId والتحقق من وجود الهدف بواسطة Document Service/Domain Adapter قبل إتاحة الملف؛ إزالة الهدف لا تترك Orphan غير معروف. (Test: TC-BR-057)

## Use Cases
- **UC-04 — تقديم طلب دراسات عليا** — Acceptance: لا يقبل Submit مع متطلب إلزامي ناقص.

## Non-Functional Requirements
- **NFR-014 — سلامة البيانات**: كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. (Verification: TC-NFR-014 / section 18.1.1)
- **NFR-022 — الملفات**: رفع الملفات عبر قناة منفصلة؛ الحد الافتراضي 200MB قابل للتهيئة. التحقق من MIME/content، منع الأنواع الخطرة، Malware scan، quarantine قبل الإتاحة، checksum، وchunked/resumable upload عند الملفات الكبيرة. (Verification: TC-NFR-022 / section 18.1.1)
- **NFR-029 — أمن الملفات**: لا يصبح أي ملف Available قبل نجاح فحص البرمجيات الخبيثة والتحقق من النوع والحجم وchecksum؛ الملف المشتبه ينتقل Quarantined ولا يُنزّل للمستخدم. (Verification: TC-NFR-029 / section 18.1.1)

## Goal
تنفيذ **Application workflow** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
