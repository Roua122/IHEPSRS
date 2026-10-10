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

export interface ApplicationDocumentLink {
  documentLinkId: string;
  documentId: string;
  purpose: string;
  linkedAt: string;
  linkedByUserId: string;
}

export interface ApplicationSubmissionSnapshot {
  snapshotId: string;
  submittedAt: string;
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
  reviewAssignedToUserId?: string;
  decision?: AdmissionDecision;
}

export interface EnrollmentDecisionHistory {
  decisionId: string;
  decidedAt: string;
  decidedByUserId: string;
  operation: "Suspend" | "Resume" | "Withdraw" | "Cancel" | "Exception";
  reason: string;
}

export interface EnrollmentRecord {
  enrollmentId: string;
  studentId: string;
  personId: string;
  institutionId: string;
  programId: string;
  applicationId: string;
  admissionCycleId: string;
  startDate: string;
  academicYear: string;
  policyVersionId: string;
  status: EnrollmentStatus;
  createdAt: string;
  completionDate?: string;
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
