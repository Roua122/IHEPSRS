# Integration Architecture — Analysis-Derived

## Processing model
`Receive → Authenticate → Validate Contract → Map Canonical Model → Idempotency Check → Business Validation → Process → Audit → Acknowledge / Retry / Quarantine`

## Patterns
| النمط | متى يستخدم | قواعد Baseline |
| --- | --- | --- |
| REST/API | طلب/استجابة أو تحديثات منخفضة التأخير | Versioned؛ auth system identity؛ timeout واضح؛ idempotency للعمليات الكتابية. |
| Event/Webhook/Message Broker | تغييرات عالية الاستقلالية/عدم تزامن | 202 durable ack؛ messageId؛ retry داخل المنصة؛ replay protection. |
| SOAP Adapter | نظام قديم موثق بـSOAP | يعزل خلف Adapter؛ يحول إلى Canonical Contract؛ لا يتسرب نموذج SOAP للـCore. |
| Scheduled Batch CSV/Excel | Legacy لا يملك API/Webhook | ملف موقّع/مشفّر أو قناة آمنة؛ schema/version؛ manifest/checksum؛ row-level errors؛ resumable import. |
| File-based secure exchange | حجوم كبيرة/وثائق/تصدير | لا email/manual USB؛ secure drop + checksum + malware scan + retention. |

## Scenarios
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

## Contract
راجع `docs/16_integration.md`.

## Physical design pending
Broker/queue/vendor, gateway product and adapter framework are Design Decisions.
