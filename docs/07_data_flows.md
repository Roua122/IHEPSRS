# Data Flows

Source: Analysis Baseline — Sections 12.3 and 13.

## System Integration Flows
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

## Dataset-Level Source of Truth
| مجموعة البيانات | Source of Truth | المالك | قاعدة التزامن |
| --- | --- | --- | --- |
| بيانات المؤسسة والبرامج المعتمدة | IHEPSRS Central Registry | CGA / IRS | External systems consume/read or propose changes |
| الهوية الأكاديمية الأساسية للطالب وحالته في الجامعة | University SIS | University | IHEPSRS stores synchronized copy; manual correction does not override source-owned fields |
| طلب الدراسات العليا وقرار القبول | IHEPSRS Postgraduate Module | PGA | Central transactional record |
| القيد في الدراسات العليا ضمن هذا المشروع | IHEPSRS Postgraduate Module | PGA | May reference SIS enrollment when integration exists |
| الرسالة والمشرف واللجنة والمناقشة | IHEPSRS Thesis Module | PGA | Authoritative for thesis lifecycle |
| ملف الباحث المركزي | IHEPSRS Research Module with verified external IDs | RA / Researcher (self-service fields only) | Affiliation may be synchronized from HR |
| بيانات الموظف/عضو هيئة التدريس الرسمية | HR System | Institution HR Owner | IHEPSRS consumes minimal required fields |
| المشروع البحثي | IHEPSRS Research Module | RA | Authoritative for research lifecycle |
| الحركة المالية الفعلية | Finance System | External Finance Owner | IHEPSRS keeps references/summary only |
| المنشورات المسجلة | IHEPSRS Research Module | Research Authority / Researcher | External DOI/ORCID services may validate identifiers |
| الوثائق | IHEPSRS Document Service | Owning domain | Versioned file store |
| سجل التدقيق | IHEPSRS Audit Service | System | Append-only logical record |

## Field-Level Source of Truth
| الكيان.الحقل | مصدر الحقيقة | قابل للتعديل في IHEPSRS؟ | قاعدة التعارض |
| --- | --- | --- | --- |
| Person.nationalIdentifier | Verified Identity Source / approved onboarding | لا إلا Data Steward workflow | لا last-write-wins؛ conflict + proof |
| Person.fullName* | Identity/SIS/HR حسب verified precedence | محدود | الأعلى ثقة wins؛ manual conflict عند التعادل |
| Student.externalStudentId | University SIS | لا | mapping only |
| Student.academicStatus | University SIS | لا | stale updates ignored |
| AcademicProgram registry fields | IHEPSRS Central Registry | نعم لأدوار Registry | external systems consume/map |
| PostgraduateApplication.status | IHEPSRS Postgraduate Domain | نعم عبر operations فقط | state machine |
| Enrollment.status | IHEPSRS Postgraduate Domain | نعم عبر decisions فقط | state machine |
| Thesis.status/title approved | IHEPSRS Thesis Domain | عبر amendment/version فقط | no direct overwrite |
| Researcher affiliation | HR/Institution source | محدود/اقتراح | AffiliationHistory preserves source |
| ResearchProject/Funding reference | IHEPSRS Research / Finance for transactions | حسب الحقل | movement never overwritten by IHEPSRS |
| Publication DOI metadata | Validated external source + Research Domain | اقتراح/تصحيح | one canonical publication per DOI |
| Role/Delegation | IHEPSRS Security Domain | Security Admin only | audited |
| Integration status | IHEPSRS Integration Domain | Integration Operator via operation | no direct DB update |

## Data Quality Rules
- Uniqueness: central keys are unique; external identifiers are unique inside their source.
- Completeness: final-state transitions require fields mandatory for that state.
- Validity: reference values must be approved and effective.
- Consistency: FK relationships and entity states must be consistent.
- Timeliness: source event time and receive time are recorded for freshness.
- Lineage: sensitive synchronized fields must retain source/time lineage.
- No Silent Overwrite: source-owned fields are not overwritten by normal manual edits.
