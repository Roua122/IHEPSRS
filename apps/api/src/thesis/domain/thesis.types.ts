/** TASK-TH-001 — Baseline v3 sections 11, 12.2.10 and 12.2.30. */
export type ThesisStatus =
  | "Draft"
  | "Registered"
  | "SupervisorAssigned"
  | "ProposalSubmitted"
  | "ProposalUnderReview"
  | "ProposalReturned"
  | "ProposalApproved"
  | "InProgress"
  | "Submitted"
  | "ReturnedForCorrection"
  | "DefenseScheduled"
  | "Defended"
  | "CorrectionsRequired"
  | "ReDefenseRequired"
  | "Approved"
  | "Failed"
  | "Archived";

export type ThesisVersionType =
  "Proposal" | "Submission" | "Approved" | "Amendment";

/** The reference transition graph: no arbitrary status updates. */
export const THESIS_TRANSITIONS: Readonly<
  Record<ThesisStatus, readonly ThesisStatus[]>
> = {
  Draft: ["Registered"],
  Registered: ["SupervisorAssigned"],
  SupervisorAssigned: ["ProposalSubmitted"],
  ProposalSubmitted: ["ProposalUnderReview"],
  ProposalUnderReview: ["ProposalReturned", "ProposalApproved"],
  ProposalReturned: ["ProposalSubmitted"],
  ProposalApproved: ["InProgress"],
  InProgress: ["Submitted"],
  Submitted: ["ReturnedForCorrection", "DefenseScheduled"],
  ReturnedForCorrection: ["InProgress"],
  DefenseScheduled: ["Defended"],
  Defended: ["Approved", "CorrectionsRequired", "ReDefenseRequired", "Failed"],
  CorrectionsRequired: ["Approved"],
  ReDefenseRequired: ["DefenseScheduled", "Failed"],
  Approved: ["Archived"],
  Failed: ["Archived"],
  Archived: [],
};

/** Thesis aggregate's live projection. Version history is held separately. */
export interface ThesisRecord {
  thesisId: string;
  enrollmentId: string;
  orgUnitId: string;
  titleAr: string;
  titleEn?: string;
  abstract?: string;
  status: ThesisStatus;
  proposalApprovedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  finalApprovedAt?: string;
  currentVersionId?: string;
  reDefenseCount: number;
  createdAt: string;
}

/** Append-only content snapshots, with the baseline's versionType vocabulary. */
export interface ThesisVersion {
  thesisVersionId: string;
  thesisId: string;
  versionNo: number;
  versionType: ThesisVersionType;
  title: string;
  titleEn?: string;
  abstract?: string;
  documentId?: string;
  documentLinkId?: string;
  createdByUserId: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

/** An approved title change creates a new Amendment version; old versions remain. */
export interface ThesisTitleAmendment {
  amendmentId: string;
  thesisId: string;
  changeType: "Title";
  baseVersionId: string;
  proposedTitleAr: string;
  proposedTitleEn?: string;
  reason: string;
  requestedByUserId: string;
  requestedAt: string;
  status: "Submitted" | "Rejected" | "Applied";
  decisionReason?: string;
  decidedByUserId?: string;
  decidedAt?: string;
  appliedVersionId?: string;
}

export interface ThesisStatusAsOf {
  thesisId: string;
  asOf: string;
  datasetVersion: string;
  status: ThesisStatus;
  versionCount: number;
}

/** Baseline 12.2.12: append-only periodic progress; supervisor fields are not user-writeable here. */
export interface ThesisProgressRecord {
  progressId: string;
  thesisId: string;
  periodFrom: string;
  periodTo: string;
  studentSummary?: string;
  supervisorAssessment?: string;
  rating?: string;
  createdByUserId: string;
  createdAt: string;
}

/** TH003 / UC-07: review evidence is append-only, scoped to one Proposal version. */
export interface ThesisProposalReview {
  reviewId: string;
  thesisId: string;
  proposalVersionId: string;
  stage: "Supervisor" | "Committee";
  outcome: "Approved" | "Returned";
  reviewedByUserId: string;
  reviewedAt: string;
  reason?: string;
  /** Approved Main SupervisorAssignment from the TH002-owned source of truth. */
  mainSupervisorAssignmentId?: string;
}

/** TASK-TH-004 / UC-08: immutable readiness sign-off for ONE Submission version. */
export interface ThesisSubmissionSupervisorConfirmation {
  confirmationId: string;
  thesisId: string;
  submissionVersionId: string;
  mainSupervisorAssignmentId: string;
  confirmedByUserId: string;
  confirmedAt: string;
}

/** Snapshot of the versioned program-policy check used at submission. */
export interface ThesisSubmissionRequirementsSnapshot {
  thesisId: string;
  submissionVersionId: string;
  assessmentId: string;
  policyVersionId: string;
  assessedAt: string;
}
