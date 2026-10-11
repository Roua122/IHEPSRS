/** Analysis Baseline v3, sections 11 and 12. No new business statuses. */
export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "NeedMoreInfo"
  | "Accepted"
  | "Rejected"
  | "Withdrawn"
  | "Cancelled";

export type EnrollmentStatus =
  | "PendingValidation"
  | "Active"
  | "Suspended"
  | "Completed"
  | "Withdrawn"
  | "Cancelled";

export interface ProgramReference {
  programId: string;
  institutionId: string;
  orgUnitId: string;
  status: "Active" | "Inactive";
  effectiveFrom: string;
  effectiveTo?: string;
  versionNo: number;
  thesisRequired: boolean;
  requiredApplicationDocumentPurposes: readonly string[];
}

export interface AdmissionCycleReference {
  admissionCycleId: string;
  programId: string;
  applicationOpenAt: string;
  applicationCloseAt: string;
  intakeStartDate: string;
  /** Optional trusted cohort reference; AdmissionCycle ID is NOT a cohort ID. */
  cohortId?: string;
  status: "Planned" | "Open" | "Closed" | "Archived";
}

export interface SyncedStudentRecord {
  studentId: string;
  personId: string;
  institutionId: string;
  sourceSystem: string;
  externalStudentId: string;
  academicStatus: string;
  lastSourceUpdateAt: string;
  sourceVersion?: string;
}

/** BR-057: target is an explicit validated DocumentLink, not a polymorphic ownerId. */
export interface ApplicationDocumentLink {
  documentLinkId: string;
  documentId: string;
  targetType: "PostgraduateApplication";
  targetId: string;
  purpose: string;
  versionNo: number;
  isActive: boolean;
  linkedAt: string;
  linkedByUserId: string;
}

export type ApplicationEditableField = "programId" | "admissionCycleId";

/** Immutable evidence of exactly what the applicant submitted (BR-041). */
export interface ApplicationSubmissionSnapshot {
  snapshotId: string;
  submittedAt: string;
  personId: string;
  programId: string;
  admissionCycleId: string;
  programVersionNo: number;
  requiredDocumentPurposes: readonly string[];
  attachedDocuments: readonly ApplicationDocumentLink[];
  iteration: number;
}

export interface ApplicationReview {
  applicationReviewId: string;
  applicationId: string;
  reviewerUserId: string;
  reviewType: "Eligibility" | "Academic" | "Final";
  decision?: "Approve" | "Reject" | "NeedMoreInfo";
  comments?: string;
  reviewedAt?: string;
}

export interface AdmissionDecision {
  decisionId: string;
  outcome: "Accepted" | "Rejected" | "ConditionalAccepted";
  decidedByUserId: string;
  decidedAt: string;
  reason?: string;
  conditions?: string;
  conditionsClearedAt?: string;
  policyVersionId: string;
}

export interface PostgraduateApplication {
  applicationId: string;
  personId: string;
  studentId?: string;
  programId: string;
  institutionId: string;
  admissionCycleId: string;
  status: ApplicationStatus;
  createdAt: string;
  attachedDocuments: ApplicationDocumentLink[];
  submissions: ApplicationSubmissionSnapshot[];
  reviews: ApplicationReview[];
  firstSubmittedAt?: string;
  submittedAt?: string;
  resubmittedAt?: string;
  needMoreInfoAt?: string;
  needMoreInfoIntervals: { from: string; to: string }[];
  requestedDocumentPurposes: string[];
  requestedFields: ApplicationEditableField[];
  reviewAssignedToUserId?: string;
  decision?: AdmissionDecision;
}

/** FR-043 / BR-052: no implicit normative values. */
export interface EnrollmentStudyLimits {
  normalStudyMonths: number;
  maxStudyMonths: number;
  maxExtensions: number;
  maxExtensionMonths: number;
}

export interface EnrollmentPolicyConfiguration {
  policyId: string;
  policyKey: "EnrollmentStudyLimits";
  scopeType: "Program" | "Cohort";
  scopeId: string;
  programId: string;
  versionNo: number;
  effectiveFrom: string;
  effectiveTo?: string;
  approvedByUserId: string;
  approvedAt: string;
  status: "Approved";
  value: EnrollmentStudyLimits;
}

/** BR-054: operationally final and distinct from an Enrollment status. */
export interface DegreeDecisionRecord {
  degreeDecisionId: string;
  enrollmentId: string;
  approvedByUserId: string;
  approvedAt: string;
  sourceEvidenceRefs: readonly string[];
  policyVersionId: string;
}

export interface EnrollmentDecisionHistory {
  decisionId: string;
  decidedAt: string;
  decidedByUserId: string;
  operation:
    | "Activate"
    | "Suspend"
    | "Resume"
    | "Withdraw"
    | "Cancel"
    | "Extend"
    | "Exception"
    | "ReEnroll"
    | "DegreeApproved";
  reason: string;
  policyVersionId: string;
  months?: number;
  referenceId?: string;
}

export interface EnrollmentRecord {
  enrollmentId: string;
  studentId: string;
  personId: string;
  institutionId: string;
  programId: string;
  applicationId: string;
  admissionCycleId: string;
  admissionDecisionId: string;
  admissionPolicyVersionId: string;
  submissionSnapshotId: string;
  submittedProgramVersionNo: number;
  startDate: string;
  academicYear: string;
  policyVersionId: string;
  policyId: string;
  policyValueSnapshot: EnrollmentStudyLimits;
  status: EnrollmentStatus;
  createdAt: string;
  plannedStudyEndDate: string;
  pendingValidationReason?: "PROGRAM_NOT_EFFECTIVE_AT_START_DATE";
  priorEnrollmentId?: string;
  completionDate?: string;
  degreeDecision?: DegreeDecisionRecord;
  decisions: EnrollmentDecisionHistory[];
}

export interface StatusHistoryRecord {
  statusHistoryId: string;
  entityType: "PostgraduateApplication" | "Enrollment" | "Thesis";
  entityId: string;
  fromStatus?: string;
  toStatus: string;
  changedAt: string;
  changedByUserId: string;
  reasonCode?: string;
  correlationId?: string;
}
