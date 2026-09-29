# Audit Developer Reference

Source: Analysis Baseline — Sections 10, 12.2.29, 14 and 18.

## AuditLog Data Dictionary
| الحقل | النوع المنطقي | إلزامي | المعنى | التحقق/ملاحظة |
| --- | --- | --- | --- | --- |
| auditId | UUID | Y | المعرف |  |
| actorUserId | FK | N | الفاعل | قد يكون System |
| action | String | Y | الإجراء |  |
| entityType | String | Y | النوع |  |
| entityId | String | N | السجل |  |
| eventTime | DateTime | Y | الوقت | UTC |
| correlationId | String | N | التتبع |  |
| oldValueHash/summary | String | N | القيمة السابقة بشكل آمن | حسب الحساسية |
| newValueHash/summary | String | N | الجديدة | حسب الحساسية |
| actorRole | String | N | الدور وقت العملية |  |
| institutionScopeId | FK | N | النطاق المؤسسي |  |
| outcome | Enum | Y | Success/Denied/Failed |  |
| reason | String | N | المبرر/سبب الرفض | إلزامي للاستثناءات |
| clientInfo | String | N | client/app/ip metadata | Masked/minimized |
| changedFields | JSON | N | قائمة الحقول المتغيرة مع قيم masked/مقننة حسب التصنيف | لا تخزن أسرارًا |
| delegationId | FK | N | التفويض المستخدم | إن وجد |

## Audit-related Business Rules
| ID | القاعدة |
| --- | --- |
| BR-026 | لا يحذف سجل له أثر أكاديمي/بحثي معتمد حذفًا ماديًا؛ يستخدم التعطيل أو الأرشفة. |
| BR-027 | المستخدم يرى فقط المؤسسات والكيانات الداخلة في نطاق صلاحياته. |
| BR-028 | أي استثناء/تفويض يجب أن يكون محدد المدة والنطاق والسبب، ممثلاً في RoleDelegation، وينتهي تلقائيًا ولا يسمح بتفويض صلاحية لا يملكها المفوض. |
| BR-033 | أي تغيير في بيانات Master Data الحساسة يسجل في Audit Log. |
| BR-035 | التقارير تحترم نفس قيود الوصول المطبقة على البيانات التشغيلية. |
| BR-037 | الوقت الرسمي للحدث هو طابع النظام المسؤول عن الحدث مع الاحتفاظ بطابع الاستلام للتكامل. |
| BR-040 | الحساب المعطل لا يمكنه إنشاء جلسة جديدة، وتنهى جلساته الفعالة وفق سياسة الأمان. |
| BR-058 | RoleDelegation ينتهي تلقائيًا عند endAt أو تعطيل أحد الحسابات أو إلغاء الدور الأصلي، أيهما أسبق؛ كل استخدام حساس للتفويض يسجل delegationId. |
| BR-060 | IntegrationSystem المؤسسي يجب أن يحمل institutionId إلزاميًا، وتتحقق المنصة أن أي institution reference في payload يقع ضمن نفس النطاق؛ محاولة الكتابة لمؤسسة أخرى ترفض كـSEC-403 وتسجل SecurityEvent. |
| BR-062 | الإعدادات التنظيمية (مدة دراسة، عبء، لجنة، متطلبات، Retention) Versioned وEffective-dated؛ السجلات القائمة تحتفظ policyVersion المطبق وقت القرار. |

## Audit requirements
- Sensitive academic/research decisions are auditable.
- Role/delegation/security administration is auditable.
- Manual integration reprocessing is auditable.
- Sensitive reads are included where required by NFR-011.
- Audit must have tamper-evidence/WORM or equivalent control at design level.
- correlation/message/delegation identifiers are retained where relevant.
