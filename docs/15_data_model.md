# Data Model Developer Reference

Source: Analysis Baseline — Section 12.

## Core relationships
Institution contains OrgUnits and Programs. Person may have Student/Researcher/UserAccount profiles.
Student relates to Applications and Enrollments. Enrollment relates to Thesis. Thesis relates to
SupervisorAssignments, Progress, Committee, Defense and Documents. Researcher relates to
Proposals/Projects/Publications. IntegrationMessage records each technical exchange and AuditLog
records sensitive actions.

## Entity Dictionary
- [Institution](data_dictionary/Institution.md)
- [OrgUnit](data_dictionary/OrgUnit.md)
- [AcademicProgram](data_dictionary/AcademicProgram.md)
- [Person](data_dictionary/Person.md)
- [UserAccount](data_dictionary/UserAccount.md)
- [RoleAssignment](data_dictionary/RoleAssignment.md)
- [Student](data_dictionary/Student.md)
- [PostgraduateApplication](data_dictionary/PostgraduateApplication.md)
- [Enrollment](data_dictionary/Enrollment.md)
- [Thesis](data_dictionary/Thesis.md)
- [SupervisorAssignment](data_dictionary/SupervisorAssignment.md)
- [ThesisProgress](data_dictionary/ThesisProgress.md)
- [ThesisCommittee](data_dictionary/ThesisCommittee.md)
- [ThesisCommitteeMember](data_dictionary/ThesisCommitteeMember.md)
- [DefenseSession](data_dictionary/DefenseSession.md)
- [ThesisCorrection](data_dictionary/ThesisCorrection.md)
- [Researcher](data_dictionary/Researcher.md)
- [ResearchProposal](data_dictionary/ResearchProposal.md)
- [ProposalReview](data_dictionary/ProposalReview.md)
- [ResearchProject](data_dictionary/ResearchProject.md)
- [ProjectMember](data_dictionary/ProjectMember.md)
- [FundingRecord](data_dictionary/FundingRecord.md)
- [Publication](data_dictionary/Publication.md)
- [PublicationAuthor](data_dictionary/PublicationAuthor.md)
- [Document](data_dictionary/Document.md)
- [Notification](data_dictionary/Notification.md)
- [IntegrationSystem](data_dictionary/IntegrationSystem.md)
- [IntegrationMessage](data_dictionary/IntegrationMessage.md)
- [AuditLog](data_dictionary/AuditLog.md)
- [ThesisVersion](data_dictionary/ThesisVersion.md)
- [DocumentLink](data_dictionary/DocumentLink.md)
- [RoleDelegation](data_dictionary/RoleDelegation.md)
- [IntegrationAttempt](data_dictionary/IntegrationAttempt.md)
- [ExternalIdMapping](data_dictionary/ExternalIdMapping.md)
- [StatusHistory](data_dictionary/StatusHistory.md)
- [PolicyConfiguration](data_dictionary/PolicyConfiguration.md)
- [AdmissionCycle](data_dictionary/AdmissionCycle.md)
- [ApplicationReview](data_dictionary/ApplicationReview.md)
- [ProgramRequirement](data_dictionary/ProgramRequirement.md)
- [AmendmentRequest](data_dictionary/AmendmentRequest.md)
- [Decision](data_dictionary/Decision.md)
- [DataConflict](data_dictionary/DataConflict.md)
- [ReportSnapshot](data_dictionary/ReportSnapshot.md)
- [AffiliationHistory](data_dictionary/AffiliationHistory.md)
- [ResearchOutput](data_dictionary/ResearchOutput.md)

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

## Data Quality
راجع `docs/07_data_flows.md`.

## Design boundary
الـERD الفيزيائي، أسماء الجداول، index strategy، ORM mappings وmigration implementation هي Design Outputs،
لكن لا يجوز لها تغيير معاني الحقول والعلاقات وقواعد Source of Truth دون Change Request.
