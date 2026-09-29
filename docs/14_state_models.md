# State Models and Transitions

Source: Analysis Baseline — Section 11.

> تغيير State ليس تعديل حقل عاديًا. يجب أن يمر عبر Domain Operation تتحقق من
> الشروط والصلاحيات وتكتب Audit. أي انتقال غير مذكور مرفوض افتراضيًا.

## Canonical State Models
| الكيان | الانتقالات المرجعية | ملاحظات |
| --- | --- | --- |
| PostgraduateApplication | Draft → Submitted → UnderReview → NeedMoreInfo → Submitted → Accepted \| Rejected \| Withdrawn \| Cancelled | NeedMoreInfo يوقف SLA، ويحفظ firstSubmittedAt ونسخ التقديم. Withdrawn بمبادرة المتقدم، Cancelled إداريًا. |
| Enrollment | PendingValidation → Active ↔ Suspended → Completed \| Withdrawn \| Cancelled | PendingValidation يغطي تعارض صلاحية البرنامج/قرار القبول. Completed ينتج بعد DegreeDecision/متطلبات المسار. |
| Thesis | Draft → Registered → SupervisorAssigned → ProposalSubmitted → ProposalUnderReview → ProposalReturned → ProposalSubmitted \| ProposalApproved → InProgress → Submitted → ReturnedForCorrection → InProgress \| DefenseScheduled → Defended → Approved \| CorrectionsRequired → Approved \| ReDefenseRequired → DefenseScheduled \| Failed → Archived | كل DefenseSession مستقل. Approved/Failed/Withdrawn/Cancelled حالات نهائية تشغيليًا؛ Archived حالة سجلات لاحقة لا تلغي النتيجة. |
| ResearchProposal | Draft → Submitted → Screening → UnderReview → RevisionRequested → Submitted → Approved \| Rejected \| Withdrawn | Approved ينشئ Project عند تحقق شروط البدء. |
| ResearchProject | Planned → Active ↔ OnHold → Completed → Reopened → Active \| Terminated → Archived | Reopened مسموح قبل Archived فقط بقرار Amendment إذا ظهر تصحيح جوهري؛ التاريخ السابق لا يلغى. |
| Publication | Draft → SubmittedForValidation → Validated → PublishedRecord → Archived | رفض التحقق يعيد السجل إلى Draft مع سبب. |
| IntegrationMessage | Received → Validated → Queued → Processing → Succeeded \| RetryScheduled → Processing \| FailedPermanent → Quarantined → ReprocessQueued → Processing \| Discarded → Closed; DuplicateIgnored \| StaleIgnored | 202 Ack بعد حفظ envelope/validation الأولي، وليس بعد انتهاء المعالجة. كل محاولة في IntegrationAttempt. |
| UserAccount | Invited → Active ↔ Locked → Disabled → Archived | تعطيل الحساب يبطل الجلسات والتفويضات؛ Locked مؤقتة. Break-glass يخضع لـMFA/Monitoring. |
| AcademicProgram | Draft → Active → Suspended → Retired → Archived | effectiveFrom/effectiveTo تحددان الصلاحية. Retired يمنع admissions الجديدة مع بقاء التاريخ. |
| IntegrationSystem | Draft → PendingValidation → Active → Suspended → Disabled \| Revoked | Revoked عند credential compromise؛ العودة تتطلب credentials جديدة واختبار عقد. |
| Document | Uploaded → Scanning → Available \| Quarantined \| RejectedMalware → Archived | لا Download قبل Available؛ checksum/version ثابتان. |
| RoleDelegation | Pending → Active → Expired \| Revoked | Auto-expiry؛ لا إعادة تفعيل نفس السجل، بل تفويض جديد. |
| DataConflict | Open → Assigned → Resolved \| RejectedAsNonConflict → Closed | لا overwrite صامت أثناء Open إذا كان الحقل محميًا. |

## Thesis Critical Transition Preconditions
| الانتقال | الشروط الدنيا |
| --- | --- |
| Registered → SupervisorAssigned | Enrollment Active + مشرف رئيسي معتمد. |
| ProposalApproved → InProgress | لا متطلبات بدء معلقة. |
| InProgress → Submitted | نسخة تقديم + تأكيد المشرف + استيفاء متطلبات البرنامج. |
| DefenseScheduled → Defended | تسجيل تنفيذ الجلسة والنتيجة. |
| Approved → Archived | توفر الوثيقة النهائية وإكمال بيانات الحفظ. |
| SupervisorAssigned → ProposalSubmitted | ThesisVersion(type=Proposal) موجود، Supervisor Active، fields/docs complete. |
| ProposalSubmitted → ProposalUnderReview | PGA/Committee assigns reviewer(s) and opens review. |
| ProposalUnderReview → ProposalReturned | Decision=RevisionRequired + reason; new proposal version on resubmission. |
| ProposalUnderReview → ProposalApproved | Required approvals complete + no unresolved conflict. |
| Submitted → ReturnedForCorrection | Pre-defense validation finds correctable issue; return reason + due date; previous SubmissionVersion immutable. |
| Defended → CorrectionsRequired | DefenseResult=PassWithCorrections; create required ThesisCorrection rows. |
| CorrectionsRequired → Approved | All mandatory corrections Verified + final approved version stored. |
| Defended → ReDefenseRequired | DefenseResult=ReDefense and reDefenseCount < allowed policy. |
| ReDefenseRequired → DefenseScheduled | New DefenseSession + approved committee/schedule; previous session retained. |
| Defended → Failed | DefenseResult=Fail or ReDefense exhausted according to policy. |

## Canonical Enum/Status Catalogue
| المجموعة | قيم Baseline |
| --- | --- |
| ApplicationStatus | Draft, Submitted, UnderReview, NeedMoreInfo, Accepted, Rejected, Withdrawn, Cancelled |
| EnrollmentStatus | PendingValidation, Active, Suspended, Completed, Withdrawn, Cancelled |
| ThesisStatus | Draft, Registered, SupervisorAssigned, ProposalSubmitted, ProposalUnderReview, ProposalReturned, ProposalApproved, InProgress, Submitted, ReturnedForCorrection, DefenseScheduled, Defended, CorrectionsRequired, ReDefenseRequired, Approved, Failed, Withdrawn, Cancelled, Archived |
| DefenseResult | Pass, PassWithCorrections, ReDefense, Fail |
| ProposalStatus | Draft, Submitted, Screening, UnderReview, RevisionRequested, Approved, Rejected, Withdrawn |
| ProjectStatus | Planned, Active, OnHold, Completed, Reopened, Terminated, Archived |
| IntegrationStatus | Received, Validated, Queued, Processing, Succeeded, RetryScheduled, FailedPermanent, Quarantined, ReprocessQueued, Discarded, Closed, DuplicateIgnored, StaleIgnored |
| UserStatus | Invited, Active, Locked, Disabled, Archived |
| IntegrationSystemStatus | Draft, PendingValidation, Active, Suspended, Disabled, Revoked |
| DocumentStatus | Uploaded, Scanning, Available, Quarantined, RejectedMalware, Archived |
| RoleDelegationStatus | Pending, Active, Expired, Revoked |
| DataConflictStatus | Open, Assigned, Resolved, RejectedAsNonConflict, Closed |
| AcademicProgramStatus | Draft, Active, Suspended, Retired, Archived |
| PublicationStatus | Draft, SubmittedForValidation, Validated, PublishedRecord, Archived |
