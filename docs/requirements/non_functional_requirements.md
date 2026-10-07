# Non-Functional Requirements — Source Extract

Source: Analysis Baseline — Section 8.2.

| ID | السمة | معيار القبول/الهدف |
| --- | --- | --- |
| NFR-001 | الأداء | عمليات الواجهة القياسية (Login، Search، Save Draft، View Record، Update Metadata) تحقق P95 ≤ 3s من المتصفح إلى الاستجابة تحت Profile Load المحدد في القسم 17؛ لا يشمل رفع الملفات أو التقارير الثقيلة. |
| NFR-002 | استجابة API | واجهات CRUD الداخلية القياسية تحقق P95 ≤ 1.5s عند قياسها على بوابة API دون زمن انتظار نظام خارجي؛ الواجهات المعتمدة على نظام خارجي لها Budget مستقل موثق في عقد التكامل. |
| NFR-003 | السعة | Design Baseline مفصول حسب النوع: 150K طلب/قيد دراسات عليا تاريخي/نشط، 100K باحث/عضو هيئة تدريس، 250K رسالة، 200K مقترح/مشروع بحثي، 1.5M منشور/مخرج بحثي، و5M سجل Document metadata. هذه افتراضات تصميم وليست إحصاءات رسمية عن اليمن. |
| NFR-004 | التزامن | دعم 2,000 مستخدم متزامن في الذروة مع قابلية التوسع أفقيًا إلى 5,000 دون تغيير منطقي في النظام. |
| NFR-005 | التوافر | الخدمات الأساسية (Authentication, Registry, Postgraduate, Thesis, Research, Integration Intake) تحقق 99.5% شهريًا باستثناء الصيانة المعتمدة. Reporting الثقيلة لا تدخل في نفس SLO. |
| NFR-006 | الاعتمادية | فشل أي تكامل خارجي لا يؤدي إلى توقف وظائف المنصة غير المعتمدة عليه. |
| NFR-007 | القابلية للتوسع | يمكن إضافة مؤسسة جديدة عبر إعدادات وتعيين Adapter/credentials دون تغيير الوحدات الأساسية. |
| NFR-008 | الأمان | TLS 1.2+ أو ما يعادله لجميع الاتصالات، Authorization على كل طلب، Least Privilege، ورفض افتراضي Deny-by-default. |
| NFR-009 | MFA | إلزام المصادقة متعددة العوامل للحسابات المركزية والإدارية الحساسة. |
| NFR-010 | إدارة الأسرار | الأسرار لا تخزن داخل جداول الأعمال؛ تحفظ في Secrets/KMS مكافئ، وتدوّر Credentials التكامل الافتراضية كل ≤90 يومًا أو فور الاشتباه، مع إبطال فوري للمفتاح المخترق. |
| NFR-011 | سجلات التدقيق | Audit غير قابل للتعديل من التطبيق، مع ضوابط Tamper-Evidence/WORM أو hash chaining مكافئ، وتدقيق قراءة البيانات الحساسة. Retention الافتراضي 7 سنوات للمشروع الأكاديمي ما لم تفرض سياسة أطول. |
| NFR-012 | النسخ الاحتياطي | RPO للخدمات التشغيلية والتدقيق ≤1 ساعة. قواعد البيانات تدعم Point-in-Time Recovery؛ النسخ الكاملة يومية، وسجلات/نسخ تزايدية كل ≤15 دقيقة حيث تدعم التقنية. |
| NFR-013 | الاستعادة | RTO للخدمات الأساسية ≤2 ساعة في سيناريو البنية المخطط؛ Reporting/Analytics ≤8 ساعات. الهدف متوافق مع SLO 99.5% عند إدارة الحوادث. |
| NFR-014 | سلامة البيانات | كل معاملة متعددة الجداول تحافظ على الاتساق، ولا تعتمد الرسالة/الطلب النهائي إلا بعد نجاح الحفظ الكامل. |
| NFR-015 | منع التكرار | Message Identity منفصلة عن Business Identity. منع إعادة تطبيق الرسالة يعتمد افتراضيًا على (sourceSystem,messageId) أو idempotencyKey غير قابل لإعادة الاستخدام، وليس externalId وحده. |
| NFR-016 | قابلية الصيانة | الوحدات ذات حدود واضحة وعقود مستقرة، مع عدم الوصول المباشر بين قواعد بيانات الأنظمة الخارجية والمنصة. |
| NFR-017 | الرصد | Observability إلزامي: structured logs، metrics، traces/correlationId، health checks، dashboards وalerts وفق القسم 14.7. |
| NFR-018 | سهولة الاستخدام | العمليات الرئيسية قابلة للتنفيذ دون تدريب تقني، مع رسائل خطأ مفهومة وإرشادات للحقول الإلزامية. |
| NFR-019 | إتاحة الواجهة | دعم العربية RTL والإنجليزية، والوظائف الأساسية تحقق WCAG 2.2 AA: keyboard navigation، focus visible، labels، contrast، screen-reader semantics، accessible errors/tables. |
| NFR-020 | التوافق | واجهة ويب متجاوبة مع المتصفحات الحديثة المدعومة مؤسسيًا. |
| NFR-021 | الزمن | تخزين الطوابع الزمنية بصيغة موحدة UTC مع عرضها وفق المنطقة الزمنية للمستخدم/المؤسسة. |
| NFR-022 | الملفات | رفع الملفات عبر قناة منفصلة؛ الحد الافتراضي 200MB قابل للتهيئة. التحقق من MIME/content، منع الأنواع الخطرة، Malware scan، quarantine قبل الإتاحة، checksum، وchunked/resumable upload عند الملفات الكبيرة. |
| NFR-023 | قابلية الاختبار | كل متطلب Must/Should له معيار قبول قابل للاختبار أو حالة اختبار مرتبطة في RTM. |
| NFR-024 | الإصدارات | عقود التكامل Versioned. Breaking change يتطلب major version جديد، فترة توافق لا تقل عن 90 يومًا في Baseline، واختبارات Contract قبل الإيقاف. |
| NFR-025 | الخصوصية | تصنيف البيانات وData Minimization إلزاميان؛ الحقول الحساسة مشفرة عند التخزين، Masked في العرض/السجل، ولا تظهر في logs أو notifications. |
| NFR-026 | التشفير عند التخزين | قواعد البيانات والنسخ الاحتياطية والملفات الحساسة تُشفّر AES-256 أو ما يعادله؛ المفاتيح منفصلة عن البيانات وتدار عبر KMS/keystore مؤسسي. |
| NFR-027 | إدارة المفاتيح | تدوير مفاتيح التشفير وفق سياسة KMS وعلى الأقل سنويًا، وتدوير أسرار الخدمات ≤90 يومًا؛ كل Rotation/Abolition مسجل تدقيقيًا. |
| NFR-028 | أمن تطبيقات الويب | الحماية القابلة للاختبار من CSRF وXSS وSQL/NoSQL Injection وSSRF وPath Traversal وBroken Access Control، باستخدام validation/encoding/parameterized access وallowlists. |
| NFR-029 | أمن الملفات | لا يصبح أي ملف Available قبل نجاح فحص البرمجيات الخبيثة والتحقق من النوع والحجم وchecksum؛ الملف المشتبه ينتقل Quarantined ولا يُنزّل للمستخدم. |
| NFR-030 | إدارة الجلسة | Admin/Sensitive: idle timeout 15m وmax session 8h. Regular users: idle 30m وmax 12h. Sensitive actions تتطلب re-authentication؛ logout/revocation يبطل الجلسة. |
| NFR-031 | المصادقة المحلية البديلة | إن وُجد Local/Break-glass: MFA إلزامي، كلمة مرور ≥12 حرفًا، منع كلمات المرور المخترقة/الشائعة، قفل مؤقت بعد 5 محاولات فاشلة خلال 15m، ولا تستخدم إلا عند تعذر SSO الموثق. |
| NFR-032 | أمن APIs والتكامل | كل نظام مصدر له هوية منفصلة ونطاق مؤسسة/Scopes؛ المصادقة عبر mTLS أو OAuth2 Client Credentials أو ما يعادلها؛ replay window افتراضي 5m؛ payload limits وrate limits لكل مصدر. |
| NFR-033 | الاستجابة للحوادث | Security events الحرجة تولد Alert فوريًا. توجد دورة Detect→Triage→Contain→Revoke→Recover→Postmortem، مع مالك حادث وتوثيق timeline وcorrelation IDs. |
| NFR-034 | إدارة الثغرات والاختبار الأمني | SAST/Dependency scan لكل build، DAST قبل الإصدار، Penetration test قبل النشر الإنتاجي/التغيير الجوهري؛ Critical يعالج ≤7 أيام وHigh ≤30 يومًا في Baseline. |
| NFR-035 | إمكانية الوصول Accessibility | الواجهات الأساسية تحقق WCAG 2.2 AA وتشمل keyboard-only، screen reader labels، focus management، contrast، accessible validation، semantic tables، وعدم الاعتماد على اللون وحده. |
| NFR-036 | المراقبة التشغيلية | قياس request rate/error rate/latency/queue depth/retry/quarantine/freshness/storage، وفصل Application/Security/Audit/Integration logs مع سياسات احتفاظ. |
| NFR-037 | التعافي من الكوارث | نسخ مشفرة خارج موقع/منطقة التشغيل يوميًا، Restore test ربع سنوي، Runbook مع صلاحية إعلان الكارثة والتعافي والتحقق بعد الاستعادة. |
| NFR-038 | البحث العربي | البحث بالاسم/العنوان يدعم Unicode normalization وإزالة التشكيل وتطبيع الهمزات/الألف والتاء المربوطة وفق سياسة بحث موثقة دون تغيير القيمة الأصلية. |
