# TASK-HRD-001 — Security verification

Status: TODO
Implementation: IMPLEMENT
Prototype Priority: MUST
Owner: Member 7

## Analysis Source
- Baseline: `docs/reference/IHEPSRS_Final_Analysis_Baseline_v3_ReviewClosed_AR.docx`
- Sections: 14, 18
- Prototype scope: `docs/21_prototype_scope.md`

## Functional Requirements
- **FR-003 — الصلاحيات RBAC**: تطبيق الأدوار والصلاحيات على مستوى الوظيفة والمؤسسة ونطاق البيانات. (Priority: Must; Test: TC-FR-003)
- **FR-037 — سجل التدقيق**: تسجيل العمليات الحساسة مع المستخدم والوقت والقيمة السابقة والجديدة عند الحاجة. (Priority: Must; Test: TC-FR-037)

## Business Rules
- **BR-027**: المستخدم يرى فقط المؤسسات والكيانات الداخلة في نطاق صلاحياته. (Test: TC-BR-027)
- **BR-028**: أي استثناء/تفويض يجب أن يكون محدد المدة والنطاق والسبب، ممثلاً في RoleDelegation، وينتهي تلقائيًا ولا يسمح بتفويض صلاحية لا يملكها المفوض. (Test: TC-BR-028)
- **BR-060**: IntegrationSystem المؤسسي يجب أن يحمل institutionId إلزاميًا، وتتحقق المنصة أن أي institution reference في payload يقع ضمن نفس النطاق؛ محاولة الكتابة لمؤسسة أخرى ترفض كـSEC-403 وتسجل SecurityEvent. (Test: TC-BR-060)

## Use Cases
- **UC-01 — تسجيل الدخول والوصول الآمن** — Acceptance: لا يستطيع مستخدم معطل الدخول؛ المستخدم الصحيح يصل فقط للوظائف المصرح بها.
- **UC-17 — إدارة الصلاحيات المؤسسية** — Acceptance: لا يستطيع مدير مفوض منح صلاحية غير موجودة ضمن delegation الخاص به.
- **UC-20 — تهيئة نظام تكامل جديد** — Acceptance: النظام لا يستطيع الكتابة خارج مؤسسته، وكل اتصال قابل للتتبع.

## Non-Functional Requirements
- **NFR-008 — الأمان**: TLS 1.2+ أو ما يعادله لجميع الاتصالات، Authorization على كل طلب، Least Privilege، ورفض افتراضي Deny-by-default. (Verification: TC-NFR-008 / section 18.1.1)
- **NFR-009 — MFA**: إلزام المصادقة متعددة العوامل للحسابات المركزية والإدارية الحساسة. (Verification: TC-NFR-009 / section 18.1.1)
- **NFR-010 — إدارة الأسرار**: الأسرار لا تخزن داخل جداول الأعمال؛ تحفظ في Secrets/KMS مكافئ، وتدوّر Credentials التكامل الافتراضية كل ≤90 يومًا أو فور الاشتباه، مع إبطال فوري للمفتاح المخترق. (Verification: TC-NFR-010 / section 18.1.1)
- **NFR-011 — سجلات التدقيق**: Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. (Verification: TC-NFR-011 / section 18.1.1)
- **NFR-025 — الخصوصية**: تصنيف البيانات وData Minimization إلزاميان؛ الحقول الحساسة مشفرة عند التخزين، Masked في العرض/السجل، ولا تظهر في logs أو notifications. (Verification: TC-NFR-025 / section 18.1.1)
- **NFR-026 — التشفير عند التخزين**: قواعد البيانات والنسخ الاحتياطية والملفات الحساسة تُشفّر AES-256 أو ما يعادله؛ المفاتيح منفصلة عن البيانات وتدار عبر KMS/keystore مؤسسي. (Verification: TC-NFR-026 / section 18.1.1)
- **NFR-027 — إدارة المفاتيح**: تدوير مفاتيح التشفير وفق سياسة KMS وعلى الأقل سنويًا، وتدوير أسرار الخدمات ≤90 يومًا؛ كل Rotation/Abolition مسجل تدقيقيًا. (Verification: TC-NFR-027 / section 18.1.1)
- **NFR-028 — أمن تطبيقات الويب**: الحماية القابلة للاختبار من CSRF وXSS وSQL/NoSQL Injection وSSRF وPath Traversal وBroken Access Control، باستخدام validation/encoding/parameterized access وallowlists. (Verification: TC-NFR-028 / section 18.1.1)
- **NFR-029 — أمن الملفات**: لا يصبح أي ملف Available قبل نجاح فحص البرمجيات الخبيثة والتحقق من النوع والحجم وchecksum؛ الملف المشتبه ينتقل Quarantined ولا يُنزّل للمستخدم. (Verification: TC-NFR-029 / section 18.1.1)
- **NFR-030 — إدارة الجلسة**: Admin/Sensitive: idle timeout 15m وmax session 8h. Regular users: idle 30m وmax 12h. Sensitive actions تتطلب re-authentication؛ logout/revocation يبطل الجلسة. (Verification: TC-NFR-030 / section 18.1.1)
- **NFR-031 — المصادقة المحلية البديلة**: إن وُجد Local/Break-glass: MFA إلزامي، كلمة مرور ≥12 حرفًا، منع كلمات المرور المخترقة/الشائعة، قفل مؤقت بعد 5 محاولات فاشلة خلال 15m، ولا تستخدم إلا عند تعذر SSO الموثق. (Verification: TC-NFR-031 / section 18.1.1)
- **NFR-032 — أمن APIs والتكامل**: كل نظام مصدر له هوية منفصلة ونطاق مؤسسة/Scopes؛ المصادقة عبر mTLS أو OAuth2 Client Credentials أو ما يعادلها؛ replay window افتراضي 5m؛ payload limits وrate limits لكل مصدر. (Verification: TC-NFR-032 / section 18.1.1)
- **NFR-033 — الاستجابة للحوادث**: Security events الحرجة تولد Alert فوريًا. توجد دورة Detect→Triage→Contain→Revoke→Recover→Postmortem، مع مالك حادث وتوثيق timeline وcorrelation IDs. (Verification: TC-NFR-033 / section 18.1.1)
- **NFR-034 — إدارة الثغرات والاختبار الأمني**: SAST/Dependency scan لكل build، DAST قبل الإصدار، Penetration test قبل النشر الإنتاجي/التغيير الجوهري؛ Critical يعالج ≤7 أيام وHigh ≤30 يومًا في Baseline. (Verification: TC-NFR-034 / section 18.1.1)
- **NFR-036 — المراقبة التشغيلية**: قياس request rate/error rate/latency/queue depth/retry/quarantine/freshness/storage، وفصل Application/Security/Audit/Integration logs مع سياسات احتفاظ. (Verification: TC-NFR-036 / section 18.1.1)

## Goal
تنفيذ **Security verification** بما يحقق المراجع أعلاه دون إضافة Business Semantics جديدة.

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
