# Use Case Scenarios — Source Extract

Source: Analysis Baseline — Section 9.

هذه هي حالات الاستخدام الرسمية للـBaseline. ملفات مستقلة لكل Use Case موجودة في
`specs/workflows/`.

## UC-01 — تسجيل الدخول والوصول الآمن

| البند | التفصيل |
| --- | --- |
| Actors | جميع المستخدمين؛ Identity Service |
| Preconditions | الحساب موجود وغير مؤرشف. |
| Trigger | إدخال بيانات الاعتماد أو بدء SSO. |
| Postconditions | جلسة فعالة مرتبطة بالمستخدم والأدوار والنطاق المؤسسي. |
| Business Rules | BR-027, BR-040 |
| Requirements | FR-002, FR-003, NFR-008, NFR-009 |
| Acceptance | لا يستطيع مستخدم معطل الدخول؛ المستخدم الصحيح يصل فقط للوظائف المصرح بها. |

## UC-02 — إدارة مؤسسة وهيكلها الأكاديمي

| البند | التفصيل |
| --- | --- |
| Actors | Central Admin؛ University Admin ضمن نطاقه |
| Preconditions | المستخدم مخول، والبيانات المرجعية اللازمة موجودة. |
| Trigger | إنشاء/تعديل مؤسسة أو كلية أو قسم أو برنامج. |
| Postconditions | هيكل أكاديمي متسق وقابل للاستخدام في بقية العمليات. |
| Business Rules | BR-001, BR-002, BR-039 |
| Requirements | FR-004..FR-007, FR-037 |
| Acceptance | لا يمكن إنشاء برنامج دون مؤسسة/قسم صالحين ولا حذف قيمة مرتبطة بسجل معتمد. |

## UC-03 — مزامنة طالب من نظام الجامعة

| البند | التفصيل |
| --- | --- |
| Actors | University SIS؛ Integration Service؛ Data Steward |
| Preconditions | المؤسسة والنظام المصدر مسجلان وبيانات الاعتماد صالحة. |
| Trigger | إنشاء/تعديل طالب أو تشغيل مزامنة مجدولة. |
| Postconditions | سجل الطالب المركزي مطابق للبيانات المملوكة للجامعة. |
| Business Rules | BR-004, BR-005, BR-029..BR-032 |
| Requirements | FR-008, FR-009, FR-034..FR-036 |
| Acceptance | إعادة إرسال نفس الرسالة لا تنشئ طالبًا إضافيًا؛ الخطأ يظهر في شاشة التكامل. |

## UC-04 — تقديم طلب دراسات عليا

| البند | التفصيل |
| --- | --- |
| Actors | Applicant/Student؛ Postgraduate Officer |
| Preconditions | فترة التقديم/البرنامج متاح وفق الإعداد. |
| Trigger | اختيار إنشاء طلب جديد. |
| Postconditions | طلب Submitted غير قابل للتعديل إلا عبر مسار الاستكمال. |
| Business Rules | BR-006 |
| Requirements | FR-010, FR-029, FR-030 |
| Acceptance | لا يقبل Submit مع متطلب إلزامي ناقص. |

## UC-05 — مراجعة واتخاذ قرار طلب الدراسات العليا

| البند | التفصيل |
| --- | --- |
| Actors | Postgraduate Reviewer؛ Authorized Approver |
| Preconditions | الطلب Submitted/UnderReview. |
| Trigger | فتح قائمة الطلبات المسندة. |
| Postconditions | قرار موثق قابل لإنشاء Enrollment عند القبول. |
| Business Rules | BR-007, BR-008 |
| Requirements | FR-011..FR-013 |
| Acceptance | كل رفض يحمل سببًا؛ لا ينشأ قيد من طلب غير مقبول. |

## UC-06 — إنشاء القيد وتعيين المشرف

| البند | التفصيل |
| --- | --- |
| Actors | Postgraduate Officer؛ Department Approver |
| Preconditions | طلب Accepted وقيد غير مكرر. |
| Trigger | بدء عملية enrollment. |
| Postconditions | قيد Active وتعيين مشرف ساري. |
| Business Rules | BR-009..BR-012 |
| Requirements | FR-013, FR-014 |
| Acceptance | تاريخ كل مشرف محفوظ ولا يكتب فوق السابق. |

## UC-07 — تسجيل واعتماد مقترح الرسالة

| البند | التفصيل |
| --- | --- |
| Actors | Student؛ Supervisor؛ Postgraduate Committee |
| Preconditions | Enrollment Active ومشرف ساري. |
| Trigger | إنشاء Thesis Proposal. |
| Postconditions | مقترح معتمد بإصدار وتاريخ واضحين. |
| Business Rules | BR-013, BR-014, BR-036 |
| Requirements | FR-015..FR-017, FR-029 |
| Acceptance | لا تنتقل الرسالة إلى InProgress قبل اعتماد المقترح. |

## UC-08 — تقديم الرسالة وتكوين لجنة المناقشة

| البند | التفصيل |
| --- | --- |
| Actors | Student؛ Supervisor؛ Postgraduate Officer |
| Preconditions | Thesis InProgress ومتطلبات التقديم مكتملة. |
| Trigger | طلب Submission. |
| Postconditions | DefenseScheduled مع لجنة وجلسة معتمدتين. |
| Business Rules | BR-015, BR-016 |
| Requirements | FR-018, FR-019 |
| Acceptance | لا يمكن جدولة جلسة بلا لجنة مكتملة أو رسالة Submitted. |

## UC-09 — تسجيل نتيجة المناقشة واعتماد الرسالة

| البند | التفصيل |
| --- | --- |
| Actors | Committee Secretary/Chair؛ Postgraduate Approver |
| Preconditions | جلسة دفاع مجدولة ومنفذة. |
| Trigger | إدخال نتيجة المناقشة. |
| Postconditions | Thesis Approved/Archived وDegree Decision موثق. |
| Business Rules | BR-017..BR-019 |
| Requirements | FR-019, FR-020, FR-040 |
| Acceptance | لا يمكن Approved مع Corrections مفتوحة. |

## UC-10 — إنشاء وتقييم مقترح بحثي

| البند | التفصيل |
| --- | --- |
| Actors | Researcher؛ Research Office؛ Reviewer |
| Preconditions | الباحث فعال وله انتماء صالح. |
| Trigger | إنشاء Research Proposal. |
| Postconditions | قرار مقترح موثق؛ Approved قابل للتحويل لمشروع. |
| Business Rules | BR-020..BR-022 |
| Requirements | FR-022, FR-023 |
| Acceptance | لا يستطيع مقدم المقترح تحكيمه أو اعتماد القرار منفردًا. |

## UC-11 — إدارة مشروع بحثي وتمويله ومخرجاته

| البند | التفصيل |
| --- | --- |
| Actors | Project Leader؛ Research Office |
| Preconditions | ResearchProposal Approved أو إنشاء إداري مخول مع سبب. |
| Trigger | بدء المشروع. |
| Postconditions | سجل مشروع كامل قابل للتقارير والربط بالمنشورات. |
| Business Rules | BR-020, BR-023 |
| Requirements | FR-024..FR-027 |
| Acceptance | لا يصبح Completed قبل اكتمال الحقول/المخرجات الإلزامية المهيأة. |

## UC-12 — تسجيل منشور علمي والتحقق منه

| البند | التفصيل |
| --- | --- |
| Actors | Researcher؛ Research Office |
| Preconditions | الباحث موجود. |
| Trigger | إضافة Publication. |
| Postconditions | Publication موثقة وقابلة للفهرسة والتقارير. |
| Business Rules | BR-024, BR-025 |
| Requirements | FR-028 |
| Acceptance | لا ينشأ سجلان مع DOI موثق متطابق. |

## UC-13 — البحث الموحد وعرض الملف

| البند | التفصيل |
| --- | --- |
| Actors | مستخدم مصرح |
| Preconditions | جلسة فعالة. |
| Trigger | إدخال معايير البحث. |
| Postconditions | لا تتسرب بيانات خارج النطاق. |
| Business Rules | BR-027, BR-035 |
| Requirements | FR-031 |
| Acceptance | المستخدم في جامعة A لا يرى تفاصيل جامعة B إلا إذا كان دوره يسمح. |

## UC-14 — إنتاج تقرير أو لوحة مؤشرات

| البند | التفصيل |
| --- | --- |
| Actors | Decision Maker؛ Admin؛ Authorized Analyst |
| Preconditions | وجود بيانات وصلاحيات. |
| Trigger | فتح dashboard أو تشغيل تقرير. |
| Postconditions | نتيجة قابلة للتكرار بنفس الفلاتر ونقطة الزمن. |
| Business Rules | BR-035 |
| Requirements | FR-032, FR-033, NFR-001 |
| Acceptance | الأرقام تتطابق مع تعريف المؤشر ومصدر البيانات المحددين. |

## UC-15 — معالجة رسالة تكامل فاشلة

| البند | التفصيل |
| --- | --- |
| Actors | Integration Service؛ Integration Operator |
| Preconditions | رسالة بحالة RetryScheduled/FailedPermanent/Quarantined. |
| Trigger | موعد إعادة المحاولة أو إجراء المشغل. |
| Postconditions | لا ينتج تكرار وتبقى كل المحاولات قابلة للتتبع. |
| Business Rules | BR-030..BR-032 |
| Requirements | FR-035, FR-036 |
| Acceptance | إعادة المعالجة بعد نجاح السبب تنتهي Succeeded دون نسخة سجل إضافية. |

## UC-16 — إدارة وثيقة وإصدارها

| البند | التفصيل |
| --- | --- |
| Actors | مستخدم مصرح؛ Document Service |
| Preconditions | الكيان المستهدف موجود والمستخدم مخول. |
| Trigger | رفع ملف جديد أو إصدار بديل. |
| Postconditions | وثيقة قابلة للاسترجاع مع تاريخ نسخ واضح. |
| Business Rules | BR-036 |
| Requirements | FR-029, NFR-022 |
| Acceptance | الإصدار السابق يبقى قابلًا للتتبع عندما تتطلب السياسة ذلك. |

## UC-17 — إدارة الصلاحيات المؤسسية

| البند | التفصيل |
| --- | --- |
| Actors | Central Security Admin؛ Delegated Admin |
| Preconditions | المستخدم مخول بإدارة الأدوار. |
| Trigger | إسناد/سحب دور أو نطاق. |
| Postconditions | صلاحيات محدثة تطبق على الجلسات وفق سياسة التجديد. |
| Business Rules | BR-027, BR-028 |
| Requirements | FR-003, FR-037 |
| Acceptance | لا يستطيع مدير مفوض منح صلاحية غير موجودة ضمن delegation الخاص به. |

## UC-18 — أرشفة سجل نهائي

| البند | التفصيل |
| --- | --- |
| Actors | Records Admin؛ Authorized Domain Officer |
| Preconditions | السجل في حالة نهائية ويسمح نوعه بالأرشفة. |
| Trigger | انتهاء فترة التشغيل أو تنفيذ سياسة الأرشفة. |
| Postconditions | سجل تاريخي محفوظ غير قابل للتغيير العادي. |
| Business Rules | BR-026, BR-039 |
| Requirements | FR-040 |
| Acceptance | لا يمكن تحرير سجل مؤرشف إلا بعملية استثنائية موثقة إن سمحت السياسة. |

## UC-19 — دورة حياة الحساب والتعطيل

| البند | التفصيل |
| --- | --- |
| Actors | Security Admin؛ User؛ Identity Provider |
| Preconditions | Person موجود وسياسة الهوية معروفة. |
| Trigger | دعوة/تفعيل/قفل/تعطيل/إنهاء ارتباط. |
| Main Flow | 1) إنشاء/ربط الحساب. 2) تحديد النطاق والأدوار. 3) تطبيق MFA. 4) تفعيل. 5) عند انتهاء العلاقة: Disable وسحب الجلسات والتفويضات. |
| Alternatives | Break-glass وفق NFR-031 فقط؛ الحساب المكرر يربط بالشخص بدل إنشاء Person جديد. |
| Postconditions | حالة الحساب والجلسات والأدوار متسقة ومسجلة. |
| Related | FR-001..003, FR-044, NFR-009/030/031. |

## UC-20 — تهيئة نظام تكامل جديد

| البند | التفصيل |
| --- | --- |
| Actors | Integration Operator؛ Security Admin؛ Institution Admin |
| Preconditions | Institution موجود؛ عقد ورسالة/Batch profile معرفان. |
| Trigger | طلب Onboarding لنظام SIS/HR/غيره. |
| Main Flow | 1) تسجيل IntegrationSystem. 2) ربط institutionId. 3) إنشاء Auth Profile في secrets manager. 4) تعريف message types/mappings. 5) اختبار الاتصال/العقد. 6) تفعيل Active. |
| Alternatives | Legacy system يستخدم Batch CSV/Excel عبر Adapter؛ فشل التحقق يبقي PendingValidation. |
| Postconditions | النظام لا يستطيع الكتابة خارج مؤسسته، وكل اتصال قابل للتتبع. |
| Related | FR-046, NFR-010/024/032. |

## UC-21 — تعليق/انسحاب/استكمال القيد

| البند | التفصيل |
| --- | --- |
| Actors | Student؛ Postgraduate Officer؛ PGA |
| Preconditions | Enrollment Active أو Suspended. |
| Trigger | طلب تجميد/انسحاب/عودة أو قرار إداري. |
| Main Flow | 1) طلب مع السبب والوثائق. 2) تحقق PolicyConfiguration. 3) قرار. 4) تحديث Enrollment state. 5) تحديث أثره على Thesis/SLA. 6) إشعار وتدقيق. |
| Alternatives | رفض؛ تمديد؛ إعادة تسجيل وفق policy. |
| Postconditions | الحالة التاريخية محفوظة ولا يوجد قيد فعال متعارض. |
| Related | BR-052..054, FR-045. |

## UC-22 — تقارير تقدم الرسالة

| البند | التفصيل |
| --- | --- |
| Actors | Student؛ Supervisor؛ Postgraduate Officer |
| Preconditions | Thesis InProgress وSupervisor active. |
| Trigger | موعد دوري أو طلب. |
| Main Flow | 1) student submits progress. 2) supervisor comments/accepts. 3) overdue monitoring. 4) record immutable version. |
| Alternatives | Return for correction؛ escalation on overdue. |
| Postconditions | ThesisProgress محفوظ ومؤرخ دون تغيير تاريخي. |
| Related | FR-016/FR-045, BR-038. |

## UC-23 — حل تكرار الشخص ودمج الهوية

| البند | التفصيل |
| --- | --- |
| Actors | Data Steward |
| Preconditions | PotentialMatch أو Duplicate candidates موجودة. |
| Trigger | مطابقة تلقائية أو بلاغ. |
| Main Flow | 1) مقارنة identifiers/affiliations. 2) اختيار canonical Person. 3) نقل/ربط profiles والمappings. 4) منع كسر التاريخ. 5) تسجيل merge. |
| Alternatives | NotSamePerson؛ defer pending evidence؛ unmerge عبر صلاحية استثنائية. |
| Postconditions | Person واحد يمثل الشخص، مع بقاء مراجع المصدر. |
| Related | FR-042, BR-055. |

## UC-24 — إنشاء تفويض مؤقت

| البند | التفصيل |
| --- | --- |
| Actors | Security Admin؛ Delegating Manager |
| Preconditions | المفوِّض يملك الصلاحية ولا يفوض أوسع منها. |
| Trigger | غياب/لجنة/مهمة مؤقتة. |
| Main Flow | 1) تحديد assignee/scope/actions/start/end/reason. 2) تحقق segregation/limits. 3) approve if required. 4) Active. 5) auto-expire/revoke. |
| Alternatives | رفض تضارب صلاحيات أو تجاوز المدة. |
| Postconditions | RoleDelegation تاريخي، محدود، قابل للتدقيق. |
| Related | FR-044, BR-028/058. |
