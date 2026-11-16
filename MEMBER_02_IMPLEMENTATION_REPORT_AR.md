# تقرير إكمال مهام العضو الثاني — مرام وديع — IHEPSRS

## نطاق التسليم
تم استكمال وتصحيح نطاق مرام: `INS001–INS004` و`PUB004–PUB005` و`HRD002` داخل الـAcademic Prototype، مع الحفاظ على IAM-004 المنجز سابقًا وعدم تعديل Baseline أو اختراع Business Rules جديدة.

## INS001–INS004
تم تحويل وحدة المؤسسات من نموذج أولي مبسط إلى نموذج يطابق الحقول المرجعية للمؤسسة والوحدة التنظيمية والبرنامج الأكاديمي وPolicyConfiguration. تستخدم العمليات الحساسة نواة IAM-003 بدل Role checks محلية، وتحترم institution scope. يحتفظ النظام بتاريخ الإصدارات والفترات الفعالة للبرامج والقيم المرجعية والسياسات، ويمنع إعادة استخدام `institutionId` المؤرشف، ويطبق تحقق أهلية القيد بحسب النسخة السارية في تاريخ الحدث. أضيفت آلية Prototype للذرية rollback + audit hash chain، مع توثيق صريح أنها ليست بديلًا عن معاملات قاعدة البيانات أو WORM production audit.

## PUB004–PUB005
أضيف AffiliationHistory effective-dated للباحث، والتحقق من affiliationOrgUnitId بتاريخ المنشور عندما تكون البيانات متاحة. يبقى affiliation snapshot داخل PublicationAuthor ولا يعاد كتابته عند تغير انتماء الباحث لاحقًا. كما أضيف ربط المؤلف الخارجي لاحقًا بـResearcher قائم دون إنشاء Publication جديد أو تغيير ترتيب المؤلف/انتمائه التاريخي، مع منع silent relink وrollback عند فشل العملية متعددة الخطوات.

## HRD002
أضيفت تحسينات accessibility للواجهة الحالية: skip link، semantic main/navigation، focus-visible، focus management وlive regions في Login، وأسماء وصول للجداول. أضيف `accessibility:check` للـweb وCI. هذه Verification للـPrototype وليست شهادة WCAG رسمية؛ الاختبار اليدوي باستخدام keyboard/screen reader/contrast يبقى مطلوبًا قبل Production release.

## التحقق الآلي المضاف
- `pnpm --filter @ihepsrs/api institutions:check`
- `pnpm --filter @ihepsrs/api publications:check` (يغطي PUB001–PUB005)
- `pnpm --filter @ihepsrs/web accessibility:check`
- CI يشغّل Institutions وResearch/Publications وAccessibility إضافة إلى baseline checks.

تم تشغيل source-linked checks محليًا على نسخة العمل ونجحت، كما نجح smoke runtime مع تحميل `InstitutionsModule` ومسارات Institutions/Publications/Research. يجب تشغيل `pnpm quality` والـchecks والـsmoke على جهاز الفريق بعد تطبيق الحزمة وقبل تحويل Status المهام إلى DONE والدمج.

## حدود التنفيذ
- تخزين Master Data الحالي In-memory للـAcademic Prototype؛ لا ندعي durable production persistence.
- Adapter/credentials المطلوبة ضمن سياق NFR-007 تبقى ملك Integration domain، ولا تخزن هذه الوحدة credentials من عندها.
- Prototype audit hash chain ليس production WORM audit storage.
- لم يتم تغيير الـBaseline؛ القرارات التقنية الحدّية موثقة في ADR-015.
