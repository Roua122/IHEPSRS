# Integration Developer Reference

Source: Analysis Baseline — Section 13.

## Mandatory Principles
- Loose Coupling
- Contract-First
- Canonical Model
- Idempotency
- Traceability / correlationId
- Fail Isolation
- Retry + Quarantine
- Backward Compatibility

## Integration Patterns
| النمط | متى يستخدم | قواعد Baseline |
| --- | --- | --- |
| REST/API | طلب/استجابة أو تحديثات منخفضة التأخير | Versioned؛ auth system identity؛ timeout واضح؛ idempotency للعمليات الكتابية. |
| Event/Webhook/Message Broker | تغييرات عالية الاستقلالية/عدم تزامن | 202 durable ack؛ messageId؛ retry داخل المنصة؛ replay protection. |
| SOAP Adapter | نظام قديم موثق بـSOAP | يعزل خلف Adapter؛ يحول إلى Canonical Contract؛ لا يتسرب نموذج SOAP للـCore. |
| Scheduled Batch CSV/Excel | Legacy لا يملك API/Webhook | ملف موقّع/مشفّر أو قناة آمنة؛ schema/version؛ manifest/checksum؛ row-level errors؛ resumable import. |
| File-based secure exchange | حجوم كبيرة/وثائق/تصدير | لا email/manual USB؛ secure drop + checksum + malware scan + retention. |

## Legacy Batch Compatibility
الجامعات التي لا تدعم APIs لا تُستبعد. يوفر Adapter مسارًا مجدولًا يستقبل CSV/Excel وفق Template Versioned، يتحقق من manifest/checksum، يسجل كل صف كـIntegrationMessage/Attempt منطقي، ويصدر Error File للصفوف المرفوضة دون قبول جزئي غير قابل للتتبع.

## Integration Scenarios
| ID | المسار | الغرض | النمط | البيانات | Idempotency | الفشل | الزمن |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-01 | University SIS → IHEPSRS | Student Upsert | Event/API or scheduled batch | Student canonical payload | (sourceSystem,messageId)؛ Business key = externalStudentId | 202 after envelope persist; internal retries; stale/duplicate ignored; quarantine permanent | Student sync ≤ 5 min event mode / ≤ 24h batch |
| INT-02 | University SIS → IHEPSRS | Program/Enrollment Reference Sync | Scheduled/API | External reference codes + mapping فقط؛ Central Registry يبقى owner | externalId + effectiveDate | Retry; reference mismatch quarantine | Daily or on change |
| INT-03 | HR → IHEPSRS | Faculty/Researcher Affiliation Sync | Scheduled/API | Person/affiliation minimal fields | employeeExternalId | Retry; do not overwrite research-owned fields | Daily |
| INT-04 | IHEPSRS → Email/SMS | Notification Delivery | Async event | Template + recipient + minimal variables | notificationId | Retry 3; status Failed; no business transaction rollback | Near real-time |
| INT-05 | Finance → IHEPSRS (read reference) | Funding status/reference only; no payments | API/Batch | projectRef/funding summary | externalFinanceRef | Manual reconciliation for permanent mismatch | Daily / on demand |
| INT-06 | Library/Repository ← IHEPSRS | Approved Thesis Metadata | Event/API | Thesis metadata + document reference | thesisId+version | Retry; not blocking final approval if repository unavailable unless configured | ≤ 24h |
| INT-07 | Repository/Index → IHEPSRS | Publication Validation | API | DOI/metadata | DOI | Timeout: remain SubmittedForValidation; validationStatus=Pending | On demand |
| INT-08 | SSO/Identity ↔ IHEPSRS | Authentication/Federation | Interactive | Identity claims | subject identifier | Fail closed for protected access | Interactive |
| INT-09 | Analytics ← IHEPSRS | Curated Data Feed | ETL/CDC | De-identified/authorized dataset | record key+version | Restartable batch; checkpointing | Nightly |
| INT-10 | External Adapter ↔ Reference Mapping Service | External↔Canonical code mappings, not ownership transfer | API | Institution/program/reference codes | code+version | Version negotiation; reject incompatible contract | On change |

## Logical Message Envelope
| الحقل | القاعدة |
| --- | --- |
| messageId | معرف immutable وفريد للرسالة عند المصدر. هو Message Identity ويستخدم مع sourceSystem لمنع إعادة التطبيق. |
| sourceSystem | رمز IntegrationSystem المسجل؛ يستنتج/يتحقق منه مقابل هوية الاتصال ولا يثق بالقيمة وحدها. |
| messageType | نوع العملية فقط مثل StudentUpsert؛ لا يحمل رقم الإصدار. |
| externalId | Business Identity للكيان في المصدر؛ لا يستخدم وحده كـ idempotency key. |
| eventTime | وقت الحدث في المصدر. الرسالة الأقدم من last processed version/time تسجل StaleIgnored. |
| correlationId | معرف للرحلة end-to-end؛ يُولد إذا لم يرسله المصدر. |
| schemaVersion | إصدار schema مستقل مثل 1.0؛ breaking change يتطلب major جديد. |
| payload | يتحقق من schema + field-level authorization؛ الأصل يحفظ مشفرًا عبر payloadOriginalRef والـhash. |
| receivedAt | يولد في المنصة ولا يؤخذ من المصدر؛ منه تقاس intake latency لا source delay. |
| acknowledgement | للرسائل asynchronous: تعاد 202 Accepted بعد authentication + envelope/schema basic validation + durable persist. المعالجة business تحدث لاحقًا؛ المصدر لا يعيد بعد 202. |
| error semantics | أخطاء قبل 202 تعاد للمصدر. بعد 202 تعالج المنصة داخليًا عبر IntegrationAttempt/Retry/Quarantine؛ operator لا يغير payload الأصلي. |

## Message Catalogue
| Message Type | Business Key | النتيجة |
| --- | --- | --- |
| StudentUpsert | sourceSystem+externalStudentId | Create/update synchronized Student fields. |
| StudentDeactivated | same | Update academicStatus; no hard delete. |
| StudentMerged | oldExternalId→newExternalId | Update ExternalIdMapping; preserve history. |
| ProgramReferenceUpsert | externalProgramCode | Update mapping proposal only; Central Registry owns canonical program. |
| EnrollmentReferenceUpsert | externalEnrollmentId | Reference/freshness update. |
| AffiliationUpsert | employeeExternalId | Append/close AffiliationHistory. |
| FundingStatusSnapshot | externalFinanceRef | Read-only funding reference. |
| ThesisMetadataPublished | thesisId+versionNo | Outbound repository metadata. |

## System Identity / Source Scope
يجب التحقق من هوية IntegrationSystem قبل قبول الرسالة. النظام المؤسسي مقيد بـinstitutionId واحد/قائمة موثقة. تستخدم mTLS أو OAuth2 Client Credentials أو آلية مؤسسية مكافئة، مع replay window افتراضي 5 دقائق، rate limit قابل للتهيئة، وحجم payload JSON افتراضي ≤10MB؛ الملفات الكبيرة تستخدم Document channel.

## Retry Policy
الخط الافتراضي: المحاولة الأصلية + 3 retries بأزمنة متزايدة؛ الأخطاء 4xx المنطقية/التحققية لا تعاد آليًا ما لم يتغير المرجع، بينما timeouts و5xx والأعطال المؤقتة تعاد. بعد استنفاد المحاولات تنتقل الرسالة إلى FailedPermanent أو Quarantined حسب قابلية المعالجة اليدوية.
