export type IntegrationMessageType =
  "StudentUpsert" | "ResearcherUpsert" | "ProgramUpsert" | "PublicationUpsert";

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
  reason: string;
}

export interface IdentityUnmergeDto {
  auditId: string;
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

export type AmendmentStatus =
  "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Applied";

export interface AmendmentRequestRecord {
  amendmentId: string;
  entityType: string;
  entityId: string;
  changeType: string;
  requestedByUserId: string;
  reason: string;
  status: AmendmentStatus;
  decisionId?: string;
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

export interface AffiliationHistoryRecord {
  affiliationId: string;
  personId: string;
  institutionId: string;
  orgUnitId?: string;
  roleRank?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  sourceSystem: string;
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
  externalPublicationId?: string;
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
  externalPublicationId?: string;
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
