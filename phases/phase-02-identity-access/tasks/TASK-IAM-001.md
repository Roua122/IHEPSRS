# TASK-IAM-001 — User/account model

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: رؤى محمد

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 14
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-001 — إدارة حسابات المستخدمين**: إنشاء الحسابات وتفعيلها وتعطيلها وإعادة تعيين بيانات الاعتماد وربطها بهوية الشخص والمؤسسة. (Priority: Must; Test: TC-FR-001)
- **FR-002 — المصادقة**: تسجيل الدخول والخروج وإدارة الجلسات ودعم المصادقة متعددة العوامل للأدوار الحساسة. (Priority: Must; Test: TC-FR-002)
- **FR-003 — الصلاحيات RBAC**: تطبيق الأدوار والصلاحيات على مستوى الوظيفة والمؤسسة ونطاق البيانات. (Priority: Must; Test: TC-FR-003)

## Business Rules
- **BR-027**: المستخدم يرى فقط المؤسسات والكيانات الداخلة في نطاق صلاحياته. (Test: TC-BR-027)
- **BR-040**: الحساب المعطل لا يمكنه إنشاء جلسة جديدة، وتنهى جلساته الفعالة وفق سياسة الأمان. (Test: TC-BR-040)
- **BR-055**: Person هو الجذر الواحد للهوية. نفس الشخص قد يملك Student/Researcher/UserAccount profiles متعددة. المطابقة تستخدم ExternalIdMapping ومعرفًا وطنيًا مشفرًا/HMAC عند توفره وتاريخ الميلاد/أدلة إضافية؛ الدمج يديره Data Steward. (Test: TC-BR-055)

## Use Cases
- **UC-01 — تسجيل الدخول والوصول الآمن** — Acceptance: لا يستطيع مستخدم معطل الدخول؛ المستخدم الصحيح يصل فقط للوظائف المصرح بها.
- **UC-19 — دورة حياة الحساب والتعطيل** — Acceptance: حالة الحساب والجلسات والأدوار متسقة ومسجلة.

## Non-Functional Requirements
- **NFR-008 — الأمان**: TLS 1.2+ أو ما يعادله لجميع الاتصالات، Authorization على كل طلب، Least Privilege، ورفض افتراضي Deny-by-default. (Verification: TC-NFR-008 / section 18.1.1)
- **NFR-009 — MFA**: إلزام المصادقة متعددة العوامل للحسابات المركزية والإدارية الحساسة. (Verification: TC-NFR-009 / section 18.1.1)
- **NFR-030 — إدارة الجلسة**: Admin/Sensitive: idle timeout 15m وmax session 8h. Regular users: idle 30m وmax 12h. Sensitive actions تتطلب re-authentication؛ logout/revocation يبطل الجلسة. (Verification: TC-NFR-030 / section 18.1.1)
- **NFR-031 — المصادقة المحلية البديلة**: إن وُجد Local/Break-glass: MFA إلزامي، كلمة مرور ≥12 حرفًا، منع كلمات المرور المخترقة/الشائعة، قفل مؤقت بعد 5 محاولات فاشلة خلال 15m، ولا تستخدم إلا عند تعذر SSO الموثق. (Verification: TC-NFR-031 / section 18.1.1)

## Goal
تنفيذ **User/account model** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
