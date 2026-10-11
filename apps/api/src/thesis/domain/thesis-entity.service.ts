import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ThesisSupervisionContextService } from "../thesis-supervision-context.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { AcademicAuditService } from "../../postgraduate/domain/academic-audit.service";
import { AcademicAuthorizationService } from "../../postgraduate/domain/academic-authorization.service";
import { AcademicReferenceService } from "../../postgraduate/domain/academic-reference.service";
import type { EnrollmentRecord } from "../../postgraduate/domain/academic.types";
import { EnrollmentLifecycleService } from "../../postgraduate/domain/enrollment-lifecycle.service";
import { ThesisDocumentGateway } from "./thesis-document.gateway";
import { ThesisSupervisorGateway } from "./thesis-supervisor.gateway";
import { ThesisSubmissionRequirementsGateway } from "./thesis-submission-requirements.gateway";
import {
  THESIS_TRANSITIONS,
  type ThesisRecord,
  type ThesisProgressRecord,
  type ThesisProposalReview,
  type ThesisSubmissionSupervisorConfirmation,
  type ThesisSubmissionRequirementsSnapshot,
  type ThesisStatus,
  type ThesisStatusAsOf,
  type ThesisTitleAmendment,
  type ThesisVersion,
} from "./thesis.types";

interface ThesisAggregate {
  record: ThesisRecord;
  versions: ThesisVersion[];
  amendments: ThesisTitleAmendment[];
  progress: ThesisProgressRecord[];
  proposalReviews: ThesisProposalReview[];
  submissionConfirmations: ThesisSubmissionSupervisorConfirmation[];
  submissionAssessments: ThesisSubmissionRequirementsSnapshot[];
}

const PRE_APPROVAL = new Set<ThesisStatus>([
  "Draft",
  "Registered",
  "SupervisorAssigned",
  "ProposalReturned",
]);
const AMENDABLE = new Set<ThesisStatus>([
  "ProposalApproved",
  "InProgress",
  "Submitted",
  "ReturnedForCorrection",
  "DefenseScheduled",
  "Defended",
  "CorrectionsRequired",
  "ReDefenseRequired",
]);

/**
 * TASK-TH-001: entity + immutable versioning foundation for TH002/TH003/TH004.
 * No public arbitrary state update. Review, supervisor, defense, corrections and
 * final approval transitions belong to their owning task implementations.
 *
 * NFR-014 limitation: Map is a prototype repository, NOT a durable transaction.
 * Replace it with a shared transactional repository before final acceptance.
 */
@Injectable()
export class ThesisEntityService {
  private readonly theses = new Map<string, ThesisAggregate>();

  constructor(
    private readonly enrollments: EnrollmentLifecycleService,
    private readonly references: AcademicReferenceService,
    private readonly persons: PersonIdentityService,
    private readonly authorization: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
    private readonly documents: ThesisDocumentGateway,
    private readonly supervisors: ThesisSupervisorGateway,
    private readonly submissionRequirements: ThesisSubmissionRequirementsGateway,
    private readonly supervisionContexts: ThesisSupervisionContextService,
  ) {}

  /** UC-07 / BR-010: the parent Enrollment must already be Active. */
  createDraft(
    input: {
      enrollmentId: string;
      titleAr: string;
      titleEn?: string;
      abstract?: string;
    },
    principal: AuthorizationPrincipal,
  ): ThesisRecord {
    const enrollment = this.enrollments.getOne(
      this.required(input?.enrollmentId, "enrollmentId"),
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    const program = this.references.getProgram(enrollment.programId);
    if (
      program.institutionId !== enrollment.institutionId ||
      !program.orgUnitId
    ) {
      throw this.conflict(
        "BR-002/BR-010: trusted owning academic unit is required",
      );
    }
    const record: ThesisRecord = {
      thesisId: randomUUID(),
      enrollmentId: enrollment.enrollmentId,
      orgUnitId: program.orgUnitId,
      titleAr: this.title(input?.titleAr, "titleAr"),
      titleEn: this.optionalTitle(input?.titleEn, "titleEn"),
      abstract: this.optionalText(input?.abstract, "abstract"),
      status: "Draft",
      reDefenseCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.audit.transition({
      entityType: "Thesis",
      entityId: record.thesisId,
      toStatus: "Draft",
      actorUserId: principal.userId,
      sourceId: "FR-016/FR-045",
      reasonCode: "DraftCreated",
    });
    this.theses.set(record.thesisId, {
      record,
      versions: [],
      amendments: [],
      progress: [],
      proposalReviews: [],
      submissionConfirmations: [],
      submissionAssessments: [],
    });
    return { ...record };
  }
  /** Only the Draft -> Registered operation is owned by TH001. */
  register(thesisId: string, principal: AuthorizationPrincipal): ThesisRecord {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );

    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    this.assertTransition(current.record.status, "Registered");

    const next: ThesisRecord = {
      ...current.record,
      status: "Registered",
    };

    const contextSnapshot = this.supervisionContexts.snapshot();

    try {
      this.supervisionContexts.register({
        thesisId,
        institutionId: enrollment.institutionId,
        programId: enrollment.programId,
        studentPersonId: enrollment.personId,
      });

      this.audit.transition({
        entityType: "Thesis",
        entityId: thesisId,
        fromStatus: current.record.status,
        toStatus: next.status,
        actorUserId: principal.userId,
        sourceId: "FR-016/BR-010/FR-045",
        reasonCode: "ThesisRegistered",
      });

      this.theses.set(thesisId, {
        ...current,
        record: next,
      });

      return { ...next };
    } catch (error) {
      this.supervisionContexts.restore(contextSnapshot);
      throw error;
    }
  } /**
   * TH-002 integration hook.
   * Initial MAIN assignment advances Registered -> SupervisorAssigned.
   * Later approved supervisor replacements must not rewind Thesis state.
   */
  recordMainSupervisorAssigned(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisRecord {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );

    this.assertActiveEnrollment(enrollment);

    if (current.record.status === "Draft") {
      throw this.conflict(
        "FR-014/BR-011: Thesis must be Registered before MAIN supervisor assignment",
      );
    }

    if (current.record.status !== "Registered") {
      return { ...current.record };
    }

    this.assertTransition(current.record.status, "SupervisorAssigned");

    const next: ThesisRecord = {
      ...current.record,
      status: "SupervisorAssigned",
    };

    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: current.record.status,
      toStatus: next.status,
      actorUserId: principal.userId,
      sourceId: "FR-014/BR-011/UC-06",
      reasonCode: "MainSupervisorAssigned",
    });

    this.theses.set(thesisId, {
      ...current,
      record: next,
    });

    return { ...next };
  }

  /**
   * BR-036/045: revisions append a distinct Proposal version. Content can be
   * drafted here; TH003 owns submission, supervisor review and approval.
   * Approved title/abstract cannot be rewritten through this endpoint.
   */
  async addProposalVersion(
    thesisId: string,
    input: {
      titleAr: string;
      titleEn?: string;
      abstract?: string;
      documentLinkId?: string;
    },
    principal: AuthorizationPrincipal,
  ): Promise<ThesisVersion> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (!PRE_APPROVAL.has(current.record.status)) {
      throw this.conflict(
        "BR-014/045: post-approval content requires an AmendmentRequest",
      );
    }
    const titleAr = this.title(input?.titleAr, "titleAr");
    const titleEn = this.optionalTitle(input?.titleEn, "titleEn");
    const abstract = this.optionalText(input?.abstract, "abstract");
    const linkId = this.optionalText(input?.documentLinkId, "documentLinkId");
    let documentId: string | undefined;
    if (linkId) {
      const verified = await this.documents.resolveAvailableLink(
        thesisId,
        linkId,
      );
      if (
        verified.available !== true ||
        verified.targetType !== "Thesis" ||
        verified.targetId !== thesisId ||
        verified.documentLinkId !== linkId ||
        !verified.documentId?.trim() ||
        !verified.purpose?.trim()
      ) {
        throw this.conflict(
          "FR-029/BR-057: document link must be available and bound to this Thesis",
        );
      }
      documentId = verified.documentId;
    }
    const version: ThesisVersion = {
      thesisVersionId: randomUUID(),
      thesisId,
      versionNo: current.versions.length + 1,
      versionType: "Proposal",
      title: titleAr,
      titleEn,
      abstract,
      documentId,
      documentLinkId: linkId,
      createdAt: new Date().toISOString(),
      createdByUserId: principal.userId,
    };
    const next: ThesisRecord = {
      ...current.record,
      titleAr,
      titleEn,
      abstract,
      currentVersionId: version.thesisVersionId,
    };
    this.audit.record(
      principal.userId,
      "thesis.version.proposal.added",
      "Thesis",
      thesisId,
      "FR-015/BR-036/BR-045",
    );
    this.theses.set(thesisId, {
      ...current,
      record: next,
      versions: [...current.versions, version],
    });
    return { ...version };
  }

  /**
   * TASK-TH-003 / UC-07 / FR-015,029 / BR-011,036,045.
   * Submit the latest *new* Proposal version and its verified plan DocumentLink.
   * A returned proposal must add a new version before re-submission.
   */
  async submitProposal(
    thesisId: string,
    input: { proposalVersionId: string },
    principal: AuthorizationPrincipal,
  ): Promise<ThesisRecord> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (
      current.record.status !== "SupervisorAssigned" &&
      current.record.status !== "ProposalReturned"
    ) {
      throw this.conflict(
        "UC-07: proposal submission requires an assigned supervisor or returned proposal",
      );
    }
    const proposalId = this.required(
      input?.proposalVersionId,
      "proposalVersionId",
    );
    const proposal = this.proposalVersion(current, proposalId, false);
    if (!proposal.abstract?.trim()) {
      throw this.invalid("FR-015: proposal abstract is required at submission");
    }
    await this.assertProposalDocument(thesisId, proposal);
    await this.assertActiveSupervisor(thesisId, enrollment.enrollmentId);
    // Re-check after the async gateways; do not overwrite a concurrent update.
    const latest = this.sameCurrent(thesisId, principal, current);
    const submittedAt = new Date().toISOString();
    const next: ThesisRecord = {
      ...latest.record,
      status: "ProposalSubmitted",
    };
    this.assertTransition(latest.record.status, next.status);
    const versions = latest.versions.map((item) =>
      item.thesisVersionId === proposalId ? { ...item, submittedAt } : item,
    );
    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: latest.record.status,
      toStatus: next.status,
      actorUserId: principal.userId,
      sourceId: "FR-015/FR-029/BR-036/BR-045/UC-07",
      reasonCode: "ProposalSubmitted",
    });
    this.theses.set(thesisId, { ...latest, record: next, versions });
    return { ...next };
  }

  /**
   * UC-07 / FR-015: the *assigned supervisor* reviews the submitted version;
   * TH003 owns the review while TH002 is the source of assignment/identity.
   * The committee then approves or returns the proposal.
   */
  async reviewProposalAsSupervisor(
    thesisId: string,
    input: { proposalVersionId: string; approve: boolean; reason?: string },
    principal: AuthorizationPrincipal,
  ): Promise<ThesisRecord> {
    if (!principal?.authenticated || !principal.userId) {
      throw new AppException({
        code: ErrorCode.Forbidden,
        status: HttpStatus.FORBIDDEN,
        message: "UC-07: assigned supervisor authentication is required",
      });
    }
    // Read only enough to locate the assignment before authenticating the
    // supervisor. No thesis data is returned before the trusted scope check.
    const current = this.theses.get(this.required(thesisId, "thesisId"));
    if (!current) throw this.notFound("FR-015: Thesis not found");
    const supervisor = await this.supervisors.assertAssignedMainSupervisor(
      thesisId,
      current.record.enrollmentId,
      principal,
    );
    if (
      supervisor.thesisId !== thesisId ||
      supervisor.enrollmentId !== current.record.enrollmentId ||
      !supervisor.assignmentId?.trim()
    ) {
      throw this.conflict(
        "UC-07/BR-011: current, assigned Main Supervisor proof is required",
      );
    }
    if (current.record.status !== "ProposalSubmitted") {
      throw this.conflict("UC-07: only a submitted Proposal may enter review");
    }
    const proposalId = this.required(
      input?.proposalVersionId,
      "proposalVersionId",
    );
    this.proposalVersion(current, proposalId, true);
    if (typeof input?.approve !== "boolean") {
      throw this.invalid("UC-07: approve must be boolean");
    }
    const reason = this.optionalText(input?.reason, "reason");
    if (!input.approve && !reason) {
      throw this.invalid(
        "UC-07: reason is required when supervisor requests revision",
      );
    }
    // After awaiting TH002 re-check the aggregate without broadening access.
    if (this.theses.get(thesisId) !== current) {
      throw this.conflict(
        "NFR-014: Thesis changed during supervisor verification; retry",
      );
    }
    const review: ThesisProposalReview = {
      reviewId: randomUUID(),
      thesisId,
      proposalVersionId: proposalId,
      stage: "Supervisor",
      outcome: input.approve ? "Approved" : "Returned",
      reviewedByUserId: principal.userId,
      reviewedAt: new Date().toISOString(),
      reason,
      mainSupervisorAssignmentId: supervisor.assignmentId,
    };
    this.assertTransition(current.record.status, "ProposalUnderReview");
    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: current.record.status,
      toStatus: "ProposalUnderReview",
      actorUserId: principal.userId,
      sourceId: "UC-07/FR-015/BR-011/BR-013",
      reasonCode: input.approve
        ? "SupervisorRecommendedApproval"
        : "SupervisorRequestedRevision",
    });
    const next: ThesisRecord = {
      ...current.record,
      status: "ProposalUnderReview",
    };
    this.theses.set(thesisId, {
      ...current,
      record: next,
      proposalReviews: [...current.proposalReviews, review],
    });
    return { ...next };
  }

  /** UC-07 / BR-013: committee return with an auditable reason. */
  returnProposal(
    thesisId: string,
    input: { proposalVersionId: string; reason: string },
    principal: AuthorizationPrincipal,
  ): ThesisRecord {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.authorization.assertAuthority(
      principal,
      enrollment.institutionId,
      enrollment.programId,
    );
    this.assertActiveEnrollment(enrollment);
    if (current.record.status !== "ProposalUnderReview") {
      throw this.conflict(
        "UC-07: only a proposal under review can be returned",
      );
    }
    const proposalId = this.required(
      input?.proposalVersionId,
      "proposalVersionId",
    );
    this.proposalVersion(current, proposalId, true);
    const reason = this.required(input?.reason, "reason");
    // A supervisor may recommend revision instead of approval.  The committee
    // must be able to formally return that proposal for a new version; only
    // the *approval* path requires a positive supervisor recommendation.
    if (
      !current.proposalReviews.some(
        (item) =>
          item.proposalVersionId === proposalId && item.stage === "Supervisor",
      )
    ) {
      throw this.conflict("UC-07: missing supervisor-review evidence");
    }
    const reviewedAt = new Date().toISOString();
    const review: ThesisProposalReview = {
      reviewId: randomUUID(),
      thesisId,
      proposalVersionId: proposalId,
      stage: "Committee",
      outcome: "Returned",
      reviewedByUserId: principal.userId,
      reviewedAt,
      reason,
    };
    this.assertTransition(current.record.status, "ProposalReturned");
    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: current.record.status,
      toStatus: "ProposalReturned",
      actorUserId: principal.userId,
      sourceId: "FR-015/BR-013/UC-07",
      reasonCode: "ProposalReturnedForChanges",
    });
    const next = { ...current.record, status: "ProposalReturned" as const };
    this.theses.set(thesisId, {
      ...current,
      record: next,
      proposalReviews: [...current.proposalReviews, review],
    });
    return { ...next };
  }

  /**
   * UC-07 / BR-013,045: institutional authority approves *this* submitted
   * version, creating a separate Approved ThesisVersion (never rewriting it).
   */
  async approveProposal(
    thesisId: string,
    input: { proposalVersionId: string; reason?: string },
    principal: AuthorizationPrincipal,
  ): Promise<{ thesis: ThesisRecord; approvedVersion: ThesisVersion }> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.authorization.assertAuthority(
      principal,
      enrollment.institutionId,
      enrollment.programId,
    );
    this.assertActiveEnrollment(enrollment);
    if (current.record.status !== "ProposalUnderReview") {
      throw this.conflict(
        "UC-07: only an institutional proposal under review may be approved",
      );
    }
    const proposalId = this.required(
      input?.proposalVersionId,
      "proposalVersionId",
    );
    const proposal = this.proposalVersion(current, proposalId, true);
    const supervisorReview = current.proposalReviews.find(
      (item) =>
        item.proposalVersionId === proposalId &&
        item.stage === "Supervisor" &&
        item.outcome === "Approved",
    );
    if (!supervisorReview?.mainSupervisorAssignmentId) {
      throw this.conflict(
        "UC-07: supervisor approval evidence must precede committee approval",
      );
    }
    const main = await this.assertActiveSupervisor(
      thesisId,
      enrollment.enrollmentId,
    );
    if (main.assignmentId !== supervisorReview.mainSupervisorAssignmentId) {
      throw this.conflict(
        "UC-07: main supervisor changed; obtain new sign-off",
      );
    }
    await this.assertProposalDocument(thesisId, proposal);
    const latest = this.sameCurrent(thesisId, principal, current);
    const now = new Date().toISOString();
    const approvedVersion: ThesisVersion = {
      ...proposal,
      thesisVersionId: randomUUID(),
      versionNo: latest.versions.length + 1,
      versionType: "Approved",
      createdByUserId: principal.userId,
      createdAt: now,
      approvedAt: now,
    };
    const next: ThesisRecord = {
      ...latest.record,
      status: "ProposalApproved",
      proposalApprovedAt: now,
      currentVersionId: approvedVersion.thesisVersionId,
      titleAr: approvedVersion.title,
      titleEn: approvedVersion.titleEn,
      abstract: approvedVersion.abstract,
    };
    const reason = this.optionalText(input?.reason, "reason");
    const review: ThesisProposalReview = {
      reviewId: randomUUID(),
      thesisId,
      proposalVersionId: proposalId,
      stage: "Committee",
      outcome: "Approved",
      reviewedByUserId: principal.userId,
      reviewedAt: now,
      reason,
    };
    this.assertTransition(latest.record.status, next.status);
    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: latest.record.status,
      toStatus: next.status,
      actorUserId: principal.userId,
      sourceId: "FR-015/BR-013/BR-045/UC-07",
      reasonCode: "ProposalApproved",
    });
    this.theses.set(thesisId, {
      ...latest,
      record: next,
      versions: [...latest.versions, approvedVersion],
      proposalReviews: [...latest.proposalReviews, review],
    });
    return { thesis: { ...next }, approvedVersion: { ...approvedVersion } };
  }

  /** UC-07 / BR-011: InProgress is impossible without formal approval. */
  async beginThesisWork(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): Promise<ThesisRecord> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.authorization.assertOfficer(
      principal,
      enrollment.institutionId,
      enrollment.programId,
    );
    this.assertActiveEnrollment(enrollment);
    if (
      current.record.status !== "ProposalApproved" ||
      !current.record.proposalApprovedAt
    ) {
      throw this.conflict(
        "UC-07: proposal approval is required before InProgress",
      );
    }
    const approved = current.versions.find(
      (item) => item.thesisVersionId === current.record.currentVersionId,
    );
    if (
      !approved ||
      (approved.versionType !== "Approved" &&
        approved.versionType !== "Amendment") ||
      !approved.approvedAt
    ) {
      throw this.conflict(
        "BR-045: approved immutable ThesisVersion is required",
      );
    }
    await this.assertActiveSupervisor(thesisId, enrollment.enrollmentId);
    const latest = this.sameCurrent(thesisId, principal, current);
    this.assertTransition(latest.record.status, "InProgress");
    const next: ThesisRecord = { ...latest.record, status: "InProgress" };
    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: latest.record.status,
      toStatus: next.status,
      actorUserId: principal.userId,
      sourceId: "FR-015/FR-016/BR-011/UC-07",
      reasonCode: "ApprovedProposalActivated",
    });
    this.theses.set(thesisId, { ...latest, record: next });
    return { ...next };
  }

  /**
   * TASK-TH-004 / UC-08 / FR-016,029 / BR-036,045.
   * Capture a new, append-only Submission version of the approved content.
   * Only a trusted, scan-cleared, purpose-classified Thesis DocumentLink can
   * represent its final file. The document bytes belong to the Document domain.
   */
  async addSubmissionVersion(
    thesisId: string,
    input: { documentLinkId: string },
    principal: AuthorizationPrincipal,
  ): Promise<ThesisVersion> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (
      current.record.status !== "InProgress" ||
      !current.record.proposalApprovedAt
    ) {
      throw this.conflict(
        "UC-08/FR-016: only an InProgress Thesis with an approved proposal can be submitted",
      );
    }
    const base = current.versions.find(
      (item) => item.thesisVersionId === current.record.currentVersionId,
    );
    if (
      !base ||
      !["Approved", "Amendment", "Submission"].includes(base.versionType)
    ) {
      throw this.conflict(
        "BR-045: an approved title/abstract snapshot is required",
      );
    }
    const documentLinkId = this.required(
      input?.documentLinkId,
      "documentLinkId",
    );
    const document = await this.documents.resolveAvailableSubmissionLink(
      thesisId,
      documentLinkId,
    );
    this.assertVerifiedSubmissionLink(thesisId, documentLinkId, document);
    const latest = this.sameCurrent(thesisId, principal, current);
    const version: ThesisVersion = {
      thesisVersionId: randomUUID(),
      thesisId,
      versionNo: latest.versions.length + 1,
      versionType: "Submission",
      title: latest.record.titleAr,
      titleEn: latest.record.titleEn,
      abstract: latest.record.abstract,
      documentId: document.documentId,
      documentLinkId,
      createdByUserId: principal.userId,
      createdAt: new Date().toISOString(),
    };
    this.audit.record(
      principal.userId,
      "thesis.version.submission.added",
      "Thesis",
      thesisId,
      "FR-016/FR-029/BR-036/BR-045/UC-08",
    );
    this.theses.set(thesisId, {
      ...latest,
      record: { ...latest.record, currentVersionId: version.thesisVersionId },
      versions: [...latest.versions, version],
    });
    return { ...version };
  }

  /**
   * TASK-TH-004 / UC-08 / Baseline 11.1.
   * Supervisor identity and active Main assignment are validated by the
   * TH002-owned gateway, not by a client-supplied `confirmed: true` flag.
   */
  async confirmSubmissionReadiness(
    thesisId: string,
    input: { submissionVersionId: string },
    principal: AuthorizationPrincipal,
  ): Promise<ThesisSubmissionSupervisorConfirmation> {
    if (!principal?.authenticated || !principal.userId) {
      throw new AppException({
        code: ErrorCode.Forbidden,
        status: HttpStatus.FORBIDDEN,
        message:
          "UC-08: authenticated assigned Main Supervisor confirmation is required",
      });
    }
    // Do not route a Supervisor through student/PGO Enrollment read permissions;
    // TH002 must validate the supervisor's access AND active Enrollment in its
    // authoritative assignment adapter before returning any evidence.
    const current = this.theses.get(this.required(thesisId, "thesisId"));
    if (!current) throw this.notFound("UC-08: Thesis not found");
    if (current.record.status !== "InProgress") {
      throw this.conflict(
        "UC-08: Supervisor confirmation requires InProgress Thesis",
      );
    }
    const submissionVersionId = this.required(
      input?.submissionVersionId,
      "submissionVersionId",
    );
    const version = this.submissionVersion(current, submissionVersionId, false);
    if (
      current.submissionConfirmations.some(
        (item) => item.submissionVersionId === submissionVersionId,
      )
    ) {
      throw this.conflict(
        "UC-08: this Submission version has already been confirmed",
      );
    }
    const assignment = await this.supervisors.assertAssignedMainSupervisor(
      thesisId,
      current.record.enrollmentId,
      principal,
    );
    if (
      assignment.thesisId !== thesisId ||
      assignment.enrollmentId !== current.record.enrollmentId ||
      !assignment.assignmentId?.trim()
    ) {
      throw this.conflict(
        "BR-011/UC-08: current Main Supervisor proof is required",
      );
    }
    await this.assertSubmissionDocument(thesisId, version);
    if (this.theses.get(thesisId) !== current) {
      throw this.conflict(
        "NFR-014: Thesis changed during supervisor verification; retry",
      );
    }
    const confirmation: ThesisSubmissionSupervisorConfirmation = {
      confirmationId: randomUUID(),
      thesisId,
      submissionVersionId,
      mainSupervisorAssignmentId: assignment.assignmentId,
      confirmedByUserId: principal.userId,
      confirmedAt: new Date().toISOString(),
    };
    this.audit.record(
      principal.userId,
      "thesis.submission.supervisor.confirmed",
      "Thesis",
      thesisId,
      "FR-016/UC-08/BR-011",
    );
    this.theses.set(thesisId, {
      ...current,
      submissionConfirmations: [
        ...current.submissionConfirmations,
        confirmation,
      ],
    });
    return { ...confirmation };
  }

  /**
   * TASK-TH-004 / UC-08: InProgress -> Submitted requires all three:
   * Submission ThesisVersion, Main Supervisor confirmation for THAT version,
   * and trusted programme requirements evidence (Baseline 11.1).
   * No defence/committee status is written here: TH005 owns that operation.
   */
  async submitThesis(
    thesisId: string,
    input: { submissionVersionId: string },
    principal: AuthorizationPrincipal,
  ): Promise<{ thesis: ThesisRecord; submissionVersion: ThesisVersion }> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (
      current.record.status !== "InProgress" ||
      !current.record.proposalApprovedAt
    ) {
      throw this.conflict(
        "UC-08: Thesis must be InProgress after proposal approval",
      );
    }
    const submissionVersionId = this.required(
      input?.submissionVersionId,
      "submissionVersionId",
    );
    const version = this.submissionVersion(current, submissionVersionId, false);
    const confirmation = current.submissionConfirmations.find(
      (item) => item.submissionVersionId === submissionVersionId,
    );
    if (!confirmation) {
      throw this.conflict(
        "UC-08: current Submission version requires Main Supervisor confirmation",
      );
    }
    const main = await this.assertActiveSupervisor(
      thesisId,
      enrollment.enrollmentId,
    );
    if (confirmation.mainSupervisorAssignmentId !== main.assignmentId) {
      throw this.conflict(
        "UC-08: Main Supervisor changed; obtain a new submission confirmation",
      );
    }
    await this.assertSubmissionDocument(thesisId, version);
    const requirements = await this.submissionRequirements.assertSatisfied(
      thesisId,
      enrollment.enrollmentId,
      enrollment.programId,
    );
    if (
      requirements?.requirementsSatisfied !== true ||
      requirements.thesisId !== thesisId ||
      requirements.enrollmentId !== enrollment.enrollmentId ||
      requirements.programId !== enrollment.programId ||
      !requirements.policyVersionId?.trim() ||
      !requirements.assessmentId?.trim()
    ) {
      throw this.conflict(
        "UC-08: matching, approved programme-requirements evidence is required",
      );
    }
    const latest = this.sameCurrent(thesisId, principal, current);
    this.assertTransition(latest.record.status, "Submitted");
    const submittedAt = new Date().toISOString();
    const submittedVersion: ThesisVersion = { ...version, submittedAt };
    const assessment: ThesisSubmissionRequirementsSnapshot = {
      thesisId,
      submissionVersionId,
      assessmentId: requirements.assessmentId,
      policyVersionId: requirements.policyVersionId,
      assessedAt: submittedAt,
    };
    const next: ThesisRecord = {
      ...latest.record,
      status: "Submitted",
      submittedAt,
    };
    this.audit.transition({
      entityType: "Thesis",
      entityId: thesisId,
      fromStatus: latest.record.status,
      toStatus: next.status,
      actorUserId: principal.userId,
      sourceId: "FR-016/FR-029/BR-015/BR-036/BR-045/UC-08/NFR-014",
      reasonCode: "SubmissionVerified",
    });
    this.theses.set(thesisId, {
      ...latest,
      record: next,
      versions: latest.versions.map((item) =>
        item.thesisVersionId === submissionVersionId ? submittedVersion : item,
      ),
      submissionAssessments: [...latest.submissionAssessments, assessment],
    });
    return { thesis: { ...next }, submissionVersion: { ...submittedVersion } };
  }

  /** Read-only, scoped confirmation history; previous evidence remains immutable. */
  submissionConfirmations(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisSubmissionSupervisorConfirmation[] {
    return this.scoped(thesisId, principal).submissionConfirmations.map(
      (item) => ({ ...item }),
    );
  }

  /**
   * TH005 / UC-08 / BR-015: future defence scheduling MUST call this guard,
   * AND independently validate approved committee composition (BR-016).
   * This is not itself a scheduling API or permission to schedule.
   */
  async assertSubmittedForDefense(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): Promise<{
    thesisId: string;
    submissionVersionId: string;
    submittedAt: string;
  }> {
    const current = this.scoped(thesisId, principal);
    if (current.record.status !== "Submitted" || !current.record.submittedAt) {
      throw this.conflict(
        "BR-015: defence cannot be scheduled before Thesis is Submitted",
      );
    }
    const version = this.submissionVersion(
      current,
      current.record.currentVersionId ?? "",
      true,
    );
    if (
      version.submittedAt !== current.record.submittedAt ||
      !current.submissionConfirmations.some(
        (item) => item.submissionVersionId === version.thesisVersionId,
      ) ||
      !current.submissionAssessments.some(
        (item) => item.submissionVersionId === version.thesisVersionId,
      )
    ) {
      throw this.conflict(
        "BR-015/BR-045: current submitted version is missing required evidence",
      );
    }
    await this.assertSubmissionDocument(thesisId, version);
    this.sameCurrent(thesisId, principal, current);
    return {
      thesisId,
      submissionVersionId: version.thesisVersionId,
      submittedAt: current.record.submittedAt,
    };
  }

  private submissionVersion(
    current: ThesisAggregate,
    versionId: string,
    mustBeSubmitted: boolean,
  ): ThesisVersion {
    const version = current.versions.at(-1);
    if (
      !version ||
      version.versionType !== "Submission" ||
      version.thesisVersionId !== versionId ||
      current.record.currentVersionId !== versionId
    ) {
      throw this.conflict(
        "BR-036/BR-045: latest immutable Submission version is required",
      );
    }
    if (Boolean(version.submittedAt) !== mustBeSubmitted) {
      throw this.conflict(
        "UC-08: Submission version state does not match this operation",
      );
    }
    return version;
  }

  private async assertSubmissionDocument(
    thesisId: string,
    version: ThesisVersion,
  ): Promise<void> {
    if (!version.documentLinkId || !version.documentId) {
      throw this.conflict(
        "FR-029: final Thesis Submission requires a verified DocumentLink",
      );
    }
    const document = await this.documents.resolveAvailableSubmissionLink(
      thesisId,
      version.documentLinkId,
    );
    this.assertVerifiedSubmissionLink(
      thesisId,
      version.documentLinkId,
      document,
    );
    if (document.documentId !== version.documentId) {
      throw this.conflict(
        "BR-036/BR-057: previously verified DocumentLink changed its target document",
      );
    }
  }

  private assertVerifiedSubmissionLink(
    thesisId: string,
    linkId: string,
    document: {
      available: true;
      targetType: "Thesis";
      targetId: string;
      documentLinkId: string;
      documentId: string;
      purpose: string;
    },
  ): void {
    if (
      document?.available !== true ||
      document.targetType !== "Thesis" ||
      document.targetId !== thesisId ||
      document.documentLinkId !== linkId ||
      !document.documentId?.trim() ||
      !document.purpose?.trim()
    ) {
      throw this.conflict(
        "FR-029/NFR-022/BR-057: final, scan-cleared Thesis document link is required",
      );
    }
  }

  /** Read-only, append-only proof of reviewer/committee actions (UC-07). */
  proposalReviews(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisProposalReview[] {
    return this.scoped(thesisId, principal).proposalReviews.map((item) => ({
      ...item,
    }));
  }

  /** Check that a plan document is still Available, bound to this Thesis, and immutable. */
  private async assertProposalDocument(
    thesisId: string,
    version: ThesisVersion,
  ): Promise<void> {
    if (!version.documentId || !version.documentLinkId) {
      throw this.conflict(
        "FR-015/FR-029: a verified proposal plan DocumentLink is required",
      );
    }
    const link = await this.documents.resolveAvailableProposalPlanLink(
      thesisId,
      version.documentLinkId,
    );
    if (
      link.available !== true ||
      link.targetType !== "Thesis" ||
      link.targetId !== thesisId ||
      link.documentLinkId !== version.documentLinkId ||
      link.documentId !== version.documentId ||
      !link.purpose?.trim()
    ) {
      throw this.conflict(
        "FR-029/NFR-022/BR-057: proposal document is not available or no longer matches",
      );
    }
  }

  /** TH002 service owns the source-of-truth SupervisorAssignment. */
  private async assertActiveSupervisor(thesisId: string, enrollmentId: string) {
    const main = await this.supervisors.assertActiveMainSupervisor(
      thesisId,
      enrollmentId,
    );
    if (
      main.thesisId !== thesisId ||
      main.enrollmentId !== enrollmentId ||
      !main.assignmentId?.trim()
    ) {
      throw this.conflict(
        "BR-011: verified active Main Supervisor assignment is required",
      );
    }
    return main;
  }

  private proposalVersion(
    current: ThesisAggregate,
    versionId: string,
    mustBeSubmitted: boolean,
  ): ThesisVersion {
    const version = current.versions.at(-1);
    if (
      !version ||
      version.thesisVersionId !== versionId ||
      version.thesisVersionId !== current.record.currentVersionId ||
      version.versionType !== "Proposal"
    ) {
      throw this.conflict(
        "BR-036/045: latest Proposal version must match the expected version",
      );
    }
    if (mustBeSubmitted !== Boolean(version.submittedAt)) {
      throw this.conflict(
        "UC-07: Proposal version submission state does not match operation",
      );
    }
    return version;
  }

  private sameCurrent(
    thesisId: string,
    principal: AuthorizationPrincipal,
    expected: ThesisAggregate,
  ): ThesisAggregate {
    const actual = this.scoped(thesisId, principal);
    if (actual !== expected) {
      throw this.conflict(
        "NFR-014: Thesis changed during external verification; retry operation",
      );
    }
    return actual;
  }

  /** BR-014/045: no direct edits to an already approved thesis title. */
  requestTitleAmendment(
    thesisId: string,
    input: { titleAr: string; titleEn?: string; reason: string },
    principal: AuthorizationPrincipal,
  ): ThesisTitleAmendment {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    this.assertAmendable(current);
    const titleAr = this.title(input?.titleAr, "titleAr");
    const titleEn = this.optionalTitle(input?.titleEn, "titleEn");
    const reason = this.required(input?.reason, "reason");
    if (
      titleAr === current.record.titleAr &&
      titleEn === current.record.titleEn
    ) {
      throw this.invalid("BR-014: amendment must change a title field");
    }
    if (current.amendments.some((request) => request.status === "Submitted")) {
      throw this.conflict(
        "BR-014: prior title AmendmentRequest requires a decision",
      );
    }
    const request: ThesisTitleAmendment = {
      amendmentId: randomUUID(),
      thesisId,
      changeType: "Title",
      baseVersionId: current.record.currentVersionId!,
      proposedTitleAr: titleAr,
      proposedTitleEn: titleEn,
      reason,
      requestedByUserId: principal.userId,
      requestedAt: new Date().toISOString(),
      status: "Submitted",
    };
    this.audit.record(
      principal.userId,
      "thesis.title.amendment.requested",
      "Thesis",
      thesisId,
      "BR-014/045",
    );
    this.theses.set(thesisId, {
      ...current,
      amendments: [...current.amendments, request],
    });
    return { ...request };
  }

  /** The decision and the new content version are committed as one projection. */
  decideTitleAmendment(
    thesisId: string,
    amendmentId: string,
    input: { approve: boolean; reason: string },
    principal: AuthorizationPrincipal,
  ): { amendment: ThesisTitleAmendment; version?: ThesisVersion } {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.authorization.assertAuthority(
      principal,
      enrollment.institutionId,
      enrollment.programId,
    );
    this.assertAmendable(current);
    const reason = this.required(input?.reason, "decision reason");
    if (typeof input?.approve !== "boolean")
      throw this.invalid("BR-014: approve must be boolean");
    const request = current.amendments.find(
      (item) => item.amendmentId === amendmentId,
    );
    if (!request) throw this.notFound("BR-014: title amendment not found");
    if (request.status !== "Submitted")
      throw this.conflict("BR-014: title amendment already decided");
    const decidedAt = new Date().toISOString();
    let version: ThesisVersion | undefined;
    let nextRecord = current.record;
    if (input.approve) {
      this.assertActiveEnrollment(enrollment);
      if (request.baseVersionId !== current.record.currentVersionId) {
        throw this.conflict(
          "BR-014/045: thesis version changed; rebase amendment before approval",
        );
      }
      const base = current.versions.find(
        (item) => item.thesisVersionId === request.baseVersionId,
      );
      if (!base) throw this.conflict("BR-045: base ThesisVersion is missing");
      version = {
        thesisVersionId: randomUUID(),
        thesisId,
        versionNo: current.versions.length + 1,
        versionType: "Amendment",
        title: request.proposedTitleAr,
        titleEn: request.proposedTitleEn,
        abstract: base.abstract,
        createdAt: decidedAt,
        submittedAt: request.requestedAt,
        approvedAt: decidedAt,
        createdByUserId: request.requestedByUserId,
      };
      nextRecord = {
        ...current.record,
        titleAr: request.proposedTitleAr,
        titleEn: request.proposedTitleEn,
        currentVersionId: version.thesisVersionId,
      };
    }
    const decision: ThesisTitleAmendment = {
      ...request,
      status: input.approve ? "Applied" : "Rejected",
      decisionReason: reason,
      decidedAt,
      decidedByUserId: principal.userId,
      appliedVersionId: version?.thesisVersionId,
    };
    this.audit.record(
      principal.userId,
      input.approve
        ? "thesis.title.amendment.applied"
        : "thesis.title.amendment.rejected",
      "Thesis",
      thesisId,
      "BR-014/BR-045",
    );
    this.theses.set(thesisId, {
      ...current,
      record: nextRecord,
      versions: version ? [...current.versions, version] : current.versions,
      amendments: current.amendments.map((item) =>
        item.amendmentId === amendmentId ? decision : item,
      ),
    });
    return {
      amendment: { ...decision },
      version: version ? { ...version } : undefined,
    };
  }

  /** UC-22 / FR-045: never edit a past progress report in place. */
  appendStudentProgress(
    thesisId: string,
    input: { periodFrom: string; periodTo: string; studentSummary: string },
    principal: AuthorizationPrincipal,
  ): ThesisProgressRecord {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(
      current.record.enrollmentId,
      principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (current.record.status !== "InProgress") {
      throw this.conflict("UC-22: progress report requires InProgress Thesis");
    }
    const from = this.strictDate(input?.periodFrom, "periodFrom");
    const to = this.strictDate(input?.periodTo, "periodTo");
    if (from > to)
      throw this.invalid("UC-22: periodFrom must not exceed periodTo");
    const report: ThesisProgressRecord = {
      progressId: randomUUID(),
      thesisId,
      periodFrom: from,
      periodTo: to,
      studentSummary: this.required(input?.studentSummary, "studentSummary"),
      createdByUserId: principal.userId,
      createdAt: new Date().toISOString(),
    };
    this.audit.record(
      principal.userId,
      "thesis.progress.student.added",
      "Thesis",
      thesisId,
      "FR-045/UC-22",
    );
    this.theses.set(thesisId, {
      ...current,
      progress: [...current.progress, report],
    });
    return { ...report };
  }

  progressReports(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisProgressRecord[] {
    return this.scoped(thesisId, principal).progress.map((entry) => ({
      ...entry,
    }));
  }

  getOne(thesisId: string, principal: AuthorizationPrincipal): ThesisRecord {
    return { ...this.scoped(thesisId, principal).record };
  }

  listByEnrollment(
    enrollmentId: string,
    principal: AuthorizationPrincipal,
  ): ThesisRecord[] {
    const enrollment = this.enrollments.getOne(
      this.required(enrollmentId, "enrollmentId"),
      principal,
    );
    return [...this.theses.values()]
      .filter((item) => item.record.enrollmentId === enrollment.enrollmentId)
      .map((item) => ({ ...item.record }));
  }

  versions(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisVersion[] {
    return this.scoped(thesisId, principal).versions.map((item) => ({
      ...item,
    }));
  }

  titleAmendments(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisTitleAmendment[] {
    return this.scoped(thesisId, principal).amendments.map((item) => ({
      ...item,
    }));
  }

  /** FR-045: a consistent status and version-count read at one UTC instant. */
  statusAsOf(
    thesisId: string,
    at: string,
    principal: AuthorizationPrincipal,
  ): ThesisStatusAsOf {
    const current = this.scoped(thesisId, principal);
    const asOf = this.utcTimestamp(at);
    const history = this.audit
      .history("Thesis", thesisId)
      .filter((item) => item.changedAt <= asOf);
    if (!history.length)
      throw this.notFound("FR-045: Thesis did not exist as of requested time");
    const last = history.at(-1)!;
    return {
      thesisId,
      asOf,
      datasetVersion: `${thesisId}:${history.length}:${last.statusHistoryId}`,
      status: last.toStatus as ThesisStatus,
      versionCount: current.versions.filter((item) => item.createdAt <= asOf)
        .length,
    };
  }

  /** Reusable by TH002/TH003/TH004, but not an arbitrary public status API. */
  assertTransition(from: ThesisStatus, to: ThesisStatus): void {
    if (!THESIS_TRANSITIONS[from].includes(to)) {
      throw this.conflict(
        `FR-016: forbidden Thesis transition ${from} -> ${to}`,
      );
    }
  }

  private scoped(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisAggregate {
    const current = this.theses.get(this.required(thesisId, "thesisId"));
    if (!current) throw this.notFound("FR-016: Thesis not found");
    // Delegates institution and person scope to the parent Enrollment owner.
    this.enrollments.getOne(current.record.enrollmentId, principal);
    return current;
  }

  private assertWriter(
    principal: AuthorizationPrincipal,
    enrollment: EnrollmentRecord,
  ): void {
    if (
      principal?.authenticated &&
      principal.personId &&
      this.persons.resolveCanonicalPersonId(principal.personId) ===
        this.persons.resolveCanonicalPersonId(enrollment.personId)
    )
      return;
    this.authorization.assertOfficer(
      principal,
      enrollment.institutionId,
      enrollment.programId,
    );
  }

  private assertActiveEnrollment(enrollment: EnrollmentRecord): void {
    if (enrollment.status !== "Active") {
      throw this.conflict(
        "BR-010: an active postgraduate Enrollment is required",
      );
    }
  }

  private assertAmendable(current: ThesisAggregate): void {
    if (
      !AMENDABLE.has(current.record.status) ||
      !current.record.currentVersionId
    ) {
      throw this.conflict(
        "BR-014/045: approved proposal and existing content version required",
      );
    }
  }

  private title(value: unknown, field: string): string {
    const text = this.required(value, field);
    if (text.length > 1000)
      throw this.invalid(`FR-015: ${field} exceeds 1000 characters`);
    return text;
  }

  private optionalTitle(value: unknown, field: string): string | undefined {
    return value === undefined ? undefined : this.title(value, field);
  }

  private optionalText(value: unknown, field: string): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string")
      throw this.invalid(`FR-015: ${field} must be a string`);
    return value.trim() || undefined;
  }

  private required(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw this.invalid(`FR-015/016: ${field} is required`);
    }
    return value.trim();
  }

  private strictDate(value: unknown, field: string): string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) ||
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
    ) {
      throw this.invalid(`FR-045: ${field} must be YYYY-MM-DD`);
    }
    return value;
  }

  private utcTimestamp(value: string): string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString() !== value
    ) {
      throw this.invalid("FR-045: at must be a valid ISO-8601 UTC timestamp");
    }
    return value;
  }
  private invalid(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }
  private conflict(message: string): AppException {
    return new AppException({
      code: ErrorCode.Conflict,
      status: HttpStatus.CONFLICT,
      message,
    });
  }
  private notFound(message: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message,
    });
  }
}
