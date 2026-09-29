# Data Architecture — Analysis-Derived

## Core relationships
راجع `docs/15_data_model.md`.

## Source of Truth
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

## Field-Level Ownership
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

## Quality Principles
Uniqueness, Completeness, Validity, Consistency, Timeliness, Lineage, No Silent Overwrite.

## Physical design pending
DB engine, schemas, indexes, partitions, ORM and migration tooling remain Design Decisions.
