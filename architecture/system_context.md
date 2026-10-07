# System Context — Analysis-Derived

Status: Analysis-derived architecture input.

## Target
System of Systems: تحتفظ الأنظمة التشغيلية في الجامعات بملكية بياناتها المصدرية، بينما توفر IHEPSRS سجلًا مركزيًا للمرجعيات والعمليات التي تقع ضمن نطاقها، وطبقة تكامل موحدة، ونسخًا متزامنة للبيانات المسموح بها، وخدمات مشتركة للأمن والتدقيق والتقارير.

## Scope boundary
IHEPSRS includes Registry, Postgraduate, Thesis, Research, Publication, Documents, Identity,
Integration, Audit, Reporting. It does not replace University SIS, Finance, HR, LMS or full Library systems.

## External Integration Catalogue
| النظام الخارجي | داخل IHEPSRS؟ | البيانات الواردة | البيانات الصادرة | النمط المسموح |
| --- | --- | --- | --- | --- |
| University SIS | لا | هوية الطالب الأكاديمية، الحالة، مراجع القيد/البرنامج | معرفات مركزية/حالات مرتبطة عند الحاجة | REST/Event؛ Batch CSV/Excel للقديم |
| HR/Faculty System | لا | انتماء عضو هيئة التدريس والرتبة/الحالة | معرف الباحث المركزي/Mapping | API أو Batch |
| Identity/SSO | لا | Claims وهوية المستخدم | طلب مصادقة/Logout/Provisioning حسب العقد | OIDC/SAML أو Adapter |
| Finance System | لا | حالة/مرجع تمويل فقط | مرجع مشروع/طلب حالة | قراءة مرجعية API/Batch؛ لا إدارة دفعات داخل IHEPSRS |
| Library/Repository | لا | Metadata/Validation عند الحاجة | Thesis/Publication metadata + document reference | API/Event |
| Email/SMS Provider | لا | Delivery status | Notification payload الحد الأدنى | Async API/Event |
| Analytics Store | خدمة مساندة ضمن الحل المستهدف | Curated feeds | Dashboards/KPIs | ETL/CDC أو Read Model |
| IHEPSRS Core | نعم | — | — | هو مصدر الحقيقة لعمليات الدراسات العليا/الرسائل/البحث التي يديرها |

## Responsibility Boundary
| المنطقة | مسؤولية IHEPSRS | مسؤولية النظام الخارجي |
| --- | --- | --- |
| Student Academic Record | نسخة متزامنة للاستعلام والربط | SIS هو المصدر الرسمي للحقول الأكاديمية. |
| Finance | حفظ مرجع/ملخص التمويل | Finance System يسجل الحركة الفعلية. |
| HR | استهلاك أقل قدر لازم من بيانات الموظف/الانتماء | HR هو المصدر الرسمي. |
| Thesis Lifecycle | مصدر الحقيقة لدورة الرسالة ضمن المشروع | قد يستقبل/يرسل metadata لمستودعات أخرى. |
| Research Lifecycle | مصدر الحقيقة للمقترح/المشروع | خدمات خارجية قد تتحقق من identifiers. |
