# Use Case Actions

هذا الملف يميز بين:
- **Source-explicit**: خطوات Main Flow مكتوبة صراحة في Baseline.
- **Developer derivation**: تقسيم تنفيذي مشتق من Trigger/Postconditions/FR/BR، وليس Requirement جديدًا.


## UC-01 — تسجيل الدخول والوصول الآمن
**Developer derivation:**
1. Authorize actors: جميع المستخدمين؛ Identity Service
2. Verify preconditions: الحساب موجود وغير مؤرشف.
3. Execute trigger/business operation: إدخال بيانات الاعتماد أو بدء SSO.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: جلسة فعالة مرتبطة بالمستخدم والأدوار والنطاق المؤسسي.
7. Verify acceptance: لا يستطيع مستخدم معطل الدخول؛ المستخدم الصحيح يصل فقط للوظائف المصرح بها.

## UC-02 — إدارة مؤسسة وهيكلها الأكاديمي
**Developer derivation:**
1. Authorize actors: Central Admin؛ University Admin ضمن نطاقه
2. Verify preconditions: المستخدم مخول، والبيانات المرجعية اللازمة موجودة.
3. Execute trigger/business operation: إنشاء/تعديل مؤسسة أو كلية أو قسم أو برنامج.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: هيكل أكاديمي متسق وقابل للاستخدام في بقية العمليات.
7. Verify acceptance: لا يمكن إنشاء برنامج دون مؤسسة/قسم صالحين ولا حذف قيمة مرتبطة بسجل معتمد.

## UC-03 — مزامنة طالب من نظام الجامعة
**Developer derivation:**
1. Authorize actors: University SIS؛ Integration Service؛ Data Steward
2. Verify preconditions: المؤسسة والنظام المصدر مسجلان وبيانات الاعتماد صالحة.
3. Execute trigger/business operation: إنشاء/تعديل طالب أو تشغيل مزامنة مجدولة.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: سجل الطالب المركزي مطابق للبيانات المملوكة للجامعة.
7. Verify acceptance: إعادة إرسال نفس الرسالة لا تنشئ طالبًا إضافيًا؛ الخطأ يظهر في شاشة التكامل.

## UC-04 — تقديم طلب دراسات عليا
**Developer derivation:**
1. Authorize actors: Applicant/Student؛ Postgraduate Officer
2. Verify preconditions: فترة التقديم/البرنامج متاح وفق الإعداد.
3. Execute trigger/business operation: اختيار إنشاء طلب جديد.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: طلب Submitted غير قابل للتعديل إلا عبر مسار الاستكمال.
7. Verify acceptance: لا يقبل Submit مع متطلب إلزامي ناقص.

## UC-05 — مراجعة واتخاذ قرار طلب الدراسات العليا
**Developer derivation:**
1. Authorize actors: Postgraduate Reviewer؛ Authorized Approver
2. Verify preconditions: الطلب Submitted/UnderReview.
3. Execute trigger/business operation: فتح قائمة الطلبات المسندة.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: قرار موثق قابل لإنشاء Enrollment عند القبول.
7. Verify acceptance: كل رفض يحمل سببًا؛ لا ينشأ قيد من طلب غير مقبول.

## UC-06 — إنشاء القيد وتعيين المشرف
**Developer derivation:**
1. Authorize actors: Postgraduate Officer؛ Department Approver
2. Verify preconditions: طلب Accepted وقيد غير مكرر.
3. Execute trigger/business operation: بدء عملية enrollment.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: قيد Active وتعيين مشرف ساري.
7. Verify acceptance: تاريخ كل مشرف محفوظ ولا يكتب فوق السابق.

## UC-07 — تسجيل واعتماد مقترح الرسالة
**Developer derivation:**
1. Authorize actors: Student؛ Supervisor؛ Postgraduate Committee
2. Verify preconditions: Enrollment Active ومشرف ساري.
3. Execute trigger/business operation: إنشاء Thesis Proposal.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: مقترح معتمد بإصدار وتاريخ واضحين.
7. Verify acceptance: لا تنتقل الرسالة إلى InProgress قبل اعتماد المقترح.

## UC-08 — تقديم الرسالة وتكوين لجنة المناقشة
**Developer derivation:**
1. Authorize actors: Student؛ Supervisor؛ Postgraduate Officer
2. Verify preconditions: Thesis InProgress ومتطلبات التقديم مكتملة.
3. Execute trigger/business operation: طلب Submission.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: DefenseScheduled مع لجنة وجلسة معتمدتين.
7. Verify acceptance: لا يمكن جدولة جلسة بلا لجنة مكتملة أو رسالة Submitted.

## UC-09 — تسجيل نتيجة المناقشة واعتماد الرسالة
**Developer derivation:**
1. Authorize actors: Committee Secretary/Chair؛ Postgraduate Approver
2. Verify preconditions: جلسة دفاع مجدولة ومنفذة.
3. Execute trigger/business operation: إدخال نتيجة المناقشة.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: Thesis Approved/Archived وDegree Decision موثق.
7. Verify acceptance: لا يمكن Approved مع Corrections مفتوحة.

## UC-10 — إنشاء وتقييم مقترح بحثي
**Developer derivation:**
1. Authorize actors: Researcher؛ Research Office؛ Reviewer
2. Verify preconditions: الباحث فعال وله انتماء صالح.
3. Execute trigger/business operation: إنشاء Research Proposal.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: قرار مقترح موثق؛ Approved قابل للتحويل لمشروع.
7. Verify acceptance: لا يستطيع مقدم المقترح تحكيمه أو اعتماد القرار منفردًا.

## UC-11 — إدارة مشروع بحثي وتمويله ومخرجاته
**Developer derivation:**
1. Authorize actors: Project Leader؛ Research Office
2. Verify preconditions: ResearchProposal Approved أو إنشاء إداري مخول مع سبب.
3. Execute trigger/business operation: بدء المشروع.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: سجل مشروع كامل قابل للتقارير والربط بالمنشورات.
7. Verify acceptance: لا يصبح Completed قبل اكتمال الحقول/المخرجات الإلزامية المهيأة.

## UC-12 — تسجيل منشور علمي والتحقق منه
**Developer derivation:**
1. Authorize actors: Researcher؛ Research Office
2. Verify preconditions: الباحث موجود.
3. Execute trigger/business operation: إضافة Publication.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: Publication موثقة وقابلة للفهرسة والتقارير.
7. Verify acceptance: لا ينشأ سجلان مع DOI موثق متطابق.

## UC-13 — البحث الموحد وعرض الملف
**Developer derivation:**
1. Authorize actors: مستخدم مصرح
2. Verify preconditions: جلسة فعالة.
3. Execute trigger/business operation: إدخال معايير البحث.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: لا تتسرب بيانات خارج النطاق.
7. Verify acceptance: المستخدم في جامعة A لا يرى تفاصيل جامعة B إلا إذا كان دوره يسمح.

## UC-14 — إنتاج تقرير أو لوحة مؤشرات
**Developer derivation:**
1. Authorize actors: Decision Maker؛ Admin؛ Authorized Analyst
2. Verify preconditions: وجود بيانات وصلاحيات.
3. Execute trigger/business operation: فتح dashboard أو تشغيل تقرير.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: نتيجة قابلة للتكرار بنفس الفلاتر ونقطة الزمن.
7. Verify acceptance: الأرقام تتطابق مع تعريف المؤشر ومصدر البيانات المحددين.

## UC-15 — معالجة رسالة تكامل فاشلة
**Developer derivation:**
1. Authorize actors: Integration Service؛ Integration Operator
2. Verify preconditions: رسالة بحالة RetryScheduled/FailedPermanent/Quarantined.
3. Execute trigger/business operation: موعد إعادة المحاولة أو إجراء المشغل.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: لا ينتج تكرار وتبقى كل المحاولات قابلة للتتبع.
7. Verify acceptance: إعادة المعالجة بعد نجاح السبب تنتهي Succeeded دون نسخة سجل إضافية.

## UC-16 — إدارة وثيقة وإصدارها
**Developer derivation:**
1. Authorize actors: مستخدم مصرح؛ Document Service
2. Verify preconditions: الكيان المستهدف موجود والمستخدم مخول.
3. Execute trigger/business operation: رفع ملف جديد أو إصدار بديل.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: وثيقة قابلة للاسترجاع مع تاريخ نسخ واضح.
7. Verify acceptance: الإصدار السابق يبقى قابلًا للتتبع عندما تتطلب السياسة ذلك.

## UC-17 — إدارة الصلاحيات المؤسسية
**Developer derivation:**
1. Authorize actors: Central Security Admin؛ Delegated Admin
2. Verify preconditions: المستخدم مخول بإدارة الأدوار.
3. Execute trigger/business operation: إسناد/سحب دور أو نطاق.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: صلاحيات محدثة تطبق على الجلسات وفق سياسة التجديد.
7. Verify acceptance: لا يستطيع مدير مفوض منح صلاحية غير موجودة ضمن delegation الخاص به.

## UC-18 — أرشفة سجل نهائي
**Developer derivation:**
1. Authorize actors: Records Admin؛ Authorized Domain Officer
2. Verify preconditions: السجل في حالة نهائية ويسمح نوعه بالأرشفة.
3. Execute trigger/business operation: انتهاء فترة التشغيل أو تنفيذ سياسة الأرشفة.
4. Enforce referenced Business Rules/Requirements.
5. Persist state/history/audit as required.
6. Verify postcondition: سجل تاريخي محفوظ غير قابل للتغيير العادي.
7. Verify acceptance: لا يمكن تحرير سجل مؤرشف إلا بعملية استثنائية موثقة إن سمحت السياسة.

## UC-19 — دورة حياة الحساب والتعطيل
**Source-explicit Main Flow:**
1) إنشاء/ربط الحساب. 2) تحديد النطاق والأدوار. 3) تطبيق MFA. 4) تفعيل. 5) عند انتهاء العلاقة: Disable وسحب الجلسات والتفويضات.

## UC-20 — تهيئة نظام تكامل جديد
**Source-explicit Main Flow:**
1) تسجيل IntegrationSystem. 2) ربط institutionId. 3) إنشاء Auth Profile في secrets manager. 4) تعريف message types/mappings. 5) اختبار الاتصال/العقد. 6) تفعيل Active.

## UC-21 — تعليق/انسحاب/استكمال القيد
**Source-explicit Main Flow:**
1) طلب مع السبب والوثائق. 2) تحقق PolicyConfiguration. 3) قرار. 4) تحديث Enrollment state. 5) تحديث أثره على Thesis/SLA. 6) إشعار وتدقيق.

## UC-22 — تقارير تقدم الرسالة
**Source-explicit Main Flow:**
1) student submits progress. 2) supervisor comments/accepts. 3) overdue monitoring. 4) record immutable version.

## UC-23 — حل تكرار الشخص ودمج الهوية
**Source-explicit Main Flow:**
1) مقارنة identifiers/affiliations. 2) اختيار canonical Person. 3) نقل/ربط profiles والمappings. 4) منع كسر التاريخ. 5) تسجيل merge.

## UC-24 — إنشاء تفويض مؤقت
**Source-explicit Main Flow:**
1) تحديد assignee/scope/actions/start/end/reason. 2) تحقق segregation/limits. 3) approve if required. 4) Active. 5) auto-expire/revoke.
