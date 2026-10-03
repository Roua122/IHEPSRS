export type IntegrationMessageType =
  | "StudentUpsert"
  | "ResearcherUpsert"
  | "ProgramUpsert"
  | "PublicationUpsert";

export interface IntegrationEnvelope<TPayload = unknown> {
  messageId: string;
  sourceSystem: string;
  schemaVersion: string;
  messageType: IntegrationMessageType;
  correlationId: string;
  eventTime: string;
  institutionId?: string;
  payload: TPayload;
}

export interface StudentUpsertPayload {
  externalId: string;
  studentNumber: string;
  fullName: string;
  email?: string;
  institutionId: string;
}

export interface HealthResponse {
  service: string;
  status: "ok";
  timestamp: string;
}

// ==========================================
// Phase 06 — Research & Person Identity Contracts
// ==========================================

export interface PersonRecord {
  personId: string;
  nationalIdentifier?: string;
  fullNameAr?: string;
  fullNameEn?: string;
  birthDate?: string;
  email?: string;
  mobile?: string;
  status: "Active" | "Archived";
}

export interface ResearcherProfile {
  researcherId: string;
  personId: string;
  institutionId: string;
  orcid?: string;
  specializationCode?: string;
  academicTitle?: string;
  department?: string;
  scopusId?: string;
  googleScholarId?: string;
  status: "Active" | "Inactive";
}

export interface ExternalIdMappingRecord {
  mappingId: string;
  sourceSystem: string;
  entityType: string;
  externalId: string;
  canonicalId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "Active" | "Retired" | "Merged";
}

export interface IdentityMergeDto {
  sourcePersonId: string;
  targetPersonId: string;
  stewardUserId: string;
  reason: string;
}

export interface IdentityMergeResult {
  mergedTargetPersonId: string;
  sourcePersonId: string;
  remappedRecordsCount: number;
  auditId: string;
  mergedAt: string;
}

export type ResearchProposalStatus =
  | "Draft"
  | "Submitted"
  | "Screening"
  | "UnderReview"
  | "RevisionRequested"
  | "Approved"
  | "Rejected"
  | "Withdrawn";

export interface ResearchProposalRecord {
  proposalId: string;
  principalResearcherId: string;
  title: string;
  abstract: string;
  initialBudget?: number;
  status: ResearchProposalStatus;
  submittedAt?: string;
  decision?: "Approved" | "Rejected";
  decisionAt?: string;
  createdProjectId?: string;
}

export interface ProposalReviewRecord {
  reviewId: string;
  proposalId: string;
  reviewerId: string;
  conflictStatus: "Clear" | "Conflict";
  conflictReason?: string;
  score?: number;
  recommendation?: "Approve" | "Reject" | "Revision";
  comments?: string;
  reviewedAt?: string;
}

export interface AssignReviewerDto {
  proposalId: string;
  reviewerId: string;
  reviewerPersonId?: string;
  reviewerInstitutionId?: string;
  hasDeclaredConflict?: boolean;
}

export type ResearchProjectStatus =
  | "Planned"
  | "Active"
  | "OnHold"
  | "Completed"
  | "Reopened"
  | "Terminated"
  | "Archived";

export interface ResearchProjectRecord {
  projectId: string;
  proposalId?: string;
  leaderId: string;
  institutionId: string;
  title: string;
  startDate: string;
  endDate?: string;
  status: ResearchProjectStatus;
}

export interface AmendmentRequestRecord {
  amendmentId: string;
  projectId: string;
  requestedBy: string;
  type: "LeaderChange" | "ScopeChange" | "Extension";
  reason: string;
  newLeaderId?: string;
  newEndDate?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  decidedAt?: string;
}

export interface ResearchOutputRecord {
  outputId: string;
  projectId: string;
  outputType: "Dataset" | "Report" | "Prototype" | "Publication" | "Other";
  title: string;
  status: "Planned" | "Submitted" | "Accepted" | "Archived";
  documentId?: string;
  completedAt?: string;
}

// ==========================================
// Phase 07 — Publications Contracts
// ==========================================

export type PublicationStatus =
  | "Draft"
  | "SubmittedForValidation"
  | "Validated"
  | "PublishedRecord"
  | "Archived";

export interface PublicationRecord {
  publicationId: string;
  title: string;
  type: "Article" | "Conference" | "Book" | "Chapter" | "Patent" | "Other";
  doi?: string;
  publicationDate?: string;
  venue?: string;
  status: PublicationStatus;
  projectId?: string;
  thesisId?: string;
  authors: PublicationAuthorRecord[];
}

export interface PublicationAuthorRecord {
  id: string;
  publicationId: string;
  researcherId?: string;
  authorName: string;
  authorOrder: number;
  correspondingAuthor: boolean;
  affiliationOrgUnitId?: string;
  affiliationText?: string;
  linkedAt?: string;
}

export interface CreatePublicationDto {
  title: string;
  type: "Article" | "Conference" | "Book" | "Chapter" | "Patent" | "Other";
  doi?: string;
  publicationDate?: string;
  venue?: string;
  projectId?: string;
  thesisId?: string;
  authors: Array<{
    researcherId?: string;
    authorName: string;
    authorOrder: number;
    correspondingAuthor?: boolean;
    affiliationOrgUnitId?: string;
    affiliationText?: string;
  }>;
}

