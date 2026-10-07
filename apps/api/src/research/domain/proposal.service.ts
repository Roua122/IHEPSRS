import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  AssignReviewerDto,
  ProposalReviewRecord,
  ResearchProposalRecord,
} from "@ihepsrs/contracts";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { writeStructuredLog } from "../../common/observability/structured-log";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { ConflictOfInterestService } from "./conflict-of-interest.service";
import { PersonIdentityService } from "./person-identity.service";
import { ProjectService } from "./project.service";
import { ResearchAuditService } from "./research-audit.service";
import { ResearchAuthorizationService } from "./research-authorization.service";

@Injectable()
export class ProposalService {
  private readonly proposals = new Map<string, ResearchProposalRecord>();
  private readonly reviews = new Map<string, ProposalReviewRecord[]>();

  constructor(
    private readonly identityService: PersonIdentityService,
    private readonly projectService: ProjectService,
    private readonly authorization: ResearchAuthorizationService,
    private readonly conflicts: ConflictOfInterestService,
    private readonly audit: ResearchAuditService,
  ) {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const proposal: ResearchProposalRecord = {
      proposalId: "PROP-101",
      principalResearcherId: "RES-101",
      title:
        "AI-Driven Framework for High-Performance Scientific Data Integration",
      abstract:
        "This proposal explores distributed data synchronization across academic institutions using event-driven architectures.",
      initialBudget: 150000,
      status: "Submitted",
      submittedAt: "2026-09-15T10:00:00Z",
    };
    this.proposals.set(proposal.proposalId, proposal);
    this.reviews.set(proposal.proposalId, []);
  }

  createProposal(
    dto: {
      principalResearcherId: string;
      title: string;
      abstract: string;
      initialBudget?: number;
    },
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const researcher = this.identityService.getResearcher(
      dto.principalResearcherId,
    );
    this.authorization.assertResearchOperation(
      principal,
      researcher.institutionId,
    );
    this.validateProposalContent(dto.title, dto.abstract, dto.initialBudget);

    const proposal: ResearchProposalRecord = {
      proposalId: randomUUID(),
      principalResearcherId: researcher.researcherId,
      title: dto.title.trim(),
      abstract: dto.abstract.trim(),
      initialBudget: dto.initialBudget,
      status: "Draft",
    };
    this.proposals.set(proposal.proposalId, proposal);
    this.reviews.set(proposal.proposalId, []);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.created",
      entityType: "ResearchProposal",
      entityId: proposal.proposalId,
      metadata: { sourceId: "FR-022" },
    });
    return { ...proposal };
  }

  submitProposal(
    proposalId: string,
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const proposal = this.requireProposal(proposalId);
    this.authorization.assertResearchOperation(
      principal,
      this.getProposalInstitutionId(proposal),
    );
    if (
      proposal.status !== "Draft" &&
      proposal.status !== "RevisionRequested"
    ) {
      throw this.validation(
        `ResearchProposal ${proposalId} cannot be submitted from ${proposal.status}`,
      );
    }

    const updated: ResearchProposalRecord = {
      ...proposal,
      status: "Submitted",
      submittedAt: new Date().toISOString(),
    };
    this.proposals.set(proposalId, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.submitted",
      entityType: "ResearchProposal",
      entityId: proposalId,
      metadata: { sourceId: "FR-022" },
    });
    return { ...updated };
  }

  screenProposal(
    proposalId: string,
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const proposal = this.requireProposal(proposalId);
    const institutionId = this.getProposalInstitutionId(proposal);
    this.authorization.assertResearchOperation(principal, institutionId);
    if (proposal.status !== "Submitted") {
      throw this.validation(
        `ResearchProposal ${proposalId} can enter Screening only from Submitted`,
      );
    }
    const updated = { ...proposal, status: "Screening" as const };
    this.proposals.set(proposalId, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.screening_started",
      entityType: "ResearchProposal",
      entityId: proposalId,
      metadata: { sourceId: "FR-023" },
    });
    return { ...updated };
  }

  assignReviewer(
    dto: AssignReviewerDto,
    principal: AuthorizationPrincipal,
  ): ProposalReviewRecord {
    const proposal = this.requireProposal(dto.proposalId);
    const institutionId = this.getProposalInstitutionId(proposal);
    this.authorization.assertResearchOperation(principal, institutionId);
    if (proposal.status !== "Screening" && proposal.status !== "UnderReview") {
      throw this.validation(
        `Reviewer assignment requires Screening or UnderReview status, found ${proposal.status}`,
      );
    }

    this.identityService.getResearcher(dto.reviewerId);
    const decision = this.conflicts.evaluate({
      principalResearcherId: proposal.principalResearcherId,
      reviewerId: dto.reviewerId,
      hasDeclaredConflict: dto.hasDeclaredConflict,
    });

    const review: ProposalReviewRecord = {
      reviewId: randomUUID(),
      proposalId: dto.proposalId,
      reviewerId: dto.reviewerId,
      conflictStatus: decision.conflict ? "Conflict" : "Clear",
      conflictReason: decision.reason,
    };
    const list = [...(this.reviews.get(dto.proposalId) ?? []), review];
    this.reviews.set(dto.proposalId, list);

    if (!decision.conflict && proposal.status === "Screening") {
      this.proposals.set(dto.proposalId, {
        ...proposal,
        status: "UnderReview",
      });
    }

    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.reviewer_assigned",
      entityType: "ProposalReview",
      entityId: review.reviewId,
      metadata: {
        sourceId: "BR-061",
        conflict: decision.conflict,
        policyVersion: decision.policyVersion,
      },
    });
    return { ...review };
  }

  submitReview(
    dto: {
      reviewId: string;
      score: number;
      recommendation: "Approve" | "Reject" | "Revision";
      comments?: string;
    },
    principal: AuthorizationPrincipal,
  ): ProposalReviewRecord {
    const located = this.findReview(dto.reviewId);
    const proposal = this.requireProposal(located.proposalId);
    this.authorization.assertResearchOperation(
      principal,
      this.getProposalInstitutionId(proposal),
    );
    const reviewer = this.identityService.getResearcher(
      located.review.reviewerId,
    );
    if (!principal.personId || principal.personId !== reviewer.personId) {
      throw this.forbidden(
        "BR-021/UC-10: A review may be submitted only by its assigned reviewer",
      );
    }
    if (located.review.conflictStatus === "Conflict") {
      throw this.forbidden(
        `BR-022: Conflicted reviewer is blocked (${located.review.conflictReason ?? "Conflict"})`,
      );
    }
    if (!Number.isFinite(dto.score)) {
      throw this.validation("Review score must be a finite number");
    }

    if (proposal.status !== "UnderReview") {
      throw this.validation("Review submission requires UnderReview status");
    }

    const updated: ProposalReviewRecord = {
      ...located.review,
      score: dto.score,
      recommendation: dto.recommendation,
      comments: dto.comments?.trim() || undefined,
      reviewedAt: new Date().toISOString(),
    };
    const list = [...(this.reviews.get(located.proposalId) ?? [])];
    list[located.index] = updated;
    this.reviews.set(located.proposalId, list);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.review_submitted",
      entityType: "ProposalReview",
      entityId: updated.reviewId,
      metadata: { sourceId: "FR-023" },
    });
    return { ...updated };
  }

  requestRevision(
    proposalId: string,
    reason: string,
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const proposal = this.requireProposal(proposalId);
    this.authorization.assertResearchOperation(
      principal,
      this.getProposalInstitutionId(proposal),
    );
    if (proposal.status !== "UnderReview") {
      throw this.validation("Revision can be requested only from UnderReview");
    }
    if (!reason?.trim()) {
      throw this.validation("Revision reason is required");
    }
    const updated = { ...proposal, status: "RevisionRequested" as const };
    this.proposals.set(proposalId, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.revision_requested",
      entityType: "ResearchProposal",
      entityId: proposalId,
      metadata: { reason: reason.trim(), sourceId: "FR-023" },
    });
    return { ...updated };
  }

  withdrawProposal(
    proposalId: string,
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const proposal = this.requireProposal(proposalId);
    const researcher = this.identityService.getResearcher(
      proposal.principalResearcherId,
    );
    this.authorization.assertResearchOperation(
      principal,
      researcher.institutionId,
    );
    if (!principal.personId || principal.personId !== researcher.personId) {
      throw this.forbidden("Only the proposal owner can withdraw the proposal");
    }
    if (["Approved", "Rejected", "Withdrawn"].includes(proposal.status)) {
      throw this.validation(`Cannot withdraw proposal from ${proposal.status}`);
    }
    const updated = { ...proposal, status: "Withdrawn" as const };
    this.proposals.set(proposalId, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.withdrawn",
      entityType: "ResearchProposal",
      entityId: proposalId,
      metadata: { sourceId: "FR-022" },
    });
    return { ...updated };
  }

  issueDecision(
    dto: {
      proposalId: string;
      decision: "Approved" | "Rejected";
      reason?: string;
    },
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const proposal = this.requireProposal(dto.proposalId);
    const institutionId = this.getProposalInstitutionId(proposal);
    this.authorization.assertResearchDecision(principal, institutionId);
    if (proposal.status !== "UnderReview") {
      throw this.validation(
        `Proposal decision requires UnderReview status, found ${proposal.status}`,
      );
    }

    const pi = this.identityService.getResearcher(
      proposal.principalResearcherId,
    );
    if (principal.personId && principal.personId === pi.personId) {
      throw this.forbidden(
        "BR-021: Proposal PI cannot issue the decision on their own proposal",
      );
    }
    const completedClearReviews = (
      this.reviews.get(dto.proposalId) ?? []
    ).filter(
      (review) =>
        review.conflictStatus === "Clear" &&
        Boolean(review.reviewedAt) &&
        Boolean(review.recommendation),
    );
    if (completedClearReviews.length === 0) {
      throw this.validation(
        "FR-023: At least one completed non-conflicted review is required before decision",
      );
    }

    let createdProjectId = proposal.createdProjectId;
    if (dto.decision === "Approved") {
      const project = this.projectService.createProjectFromApprovedProposal({
        proposalId: proposal.proposalId,
        leaderId: proposal.principalResearcherId,
        institutionId,
        title: proposal.title,
        actorUserId: principal.userId,
      });
      createdProjectId = project.projectId;
    }

    const updated: ResearchProposalRecord = {
      ...proposal,
      status: dto.decision,
      decision: dto.decision,
      decisionAt: new Date().toISOString(),
      createdProjectId,
    };
    this.proposals.set(dto.proposalId, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.proposal.decision_issued",
      entityType: "ResearchProposal",
      entityId: dto.proposalId,
      metadata: {
        sourceId: "BR-021/BR-049",
        decision: dto.decision,
        reason: dto.reason?.trim() || null,
        createdProjectId: createdProjectId ?? null,
      },
    });
    return { ...updated };
  }

  getProposal(
    proposalId: string,
    principal: AuthorizationPrincipal,
  ): ResearchProposalRecord {
    const proposal = this.requireProposal(proposalId);
    this.authorization.assertResearchOperation(
      principal,
      this.getProposalInstitutionId(proposal),
    );
    return { ...proposal };
  }

  getReviewsForProposal(
    proposalId: string,
    principal: AuthorizationPrincipal,
  ): ProposalReviewRecord[] {
    const proposal = this.requireProposal(proposalId);
    this.authorization.assertResearchOperation(
      principal,
      this.getProposalInstitutionId(proposal),
    );
    return (this.reviews.get(proposalId) ?? []).map((review) => ({
      ...review,
    }));
  }

  getAllProposals(principal: AuthorizationPrincipal): ResearchProposalRecord[] {
    return Array.from(this.proposals.values())
      .filter((proposal) => {
        const pi = this.identityService.getResearcher(
          proposal.principalResearcherId,
        );
        return this.authorization.canManageInstitution(
          principal,
          pi.institutionId,
        );
      })
      .map((proposal) => ({ ...proposal }));
  }

  private getProposalInstitutionId(proposal: ResearchProposalRecord): string {
    return this.identityService.getResearcher(proposal.principalResearcherId)
      .institutionId;
  }

  private requireProposal(proposalId: string): ResearchProposalRecord {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new AppException({
        code: ErrorCode.NotFound,
        status: HttpStatus.NOT_FOUND,
        message: `Proposal ${proposalId} not found`,
      });
    }
    return proposal;
  }

  private findReview(reviewId: string): {
    proposalId: string;
    index: number;
    review: ProposalReviewRecord;
  } {
    for (const [proposalId, list] of this.reviews.entries()) {
      const index = list.findIndex((review) => review.reviewId === reviewId);
      if (index >= 0) return { proposalId, index, review: list[index] };
    }
    throw new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message: `Review ${reviewId} not found`,
    });
  }

  private validateProposalContent(
    title: string,
    abstract: string,
    initialBudget?: number,
  ): void {
    if (!title?.trim() || !abstract?.trim()) {
      throw this.validation("Proposal title and abstract are required");
    }
    if (
      initialBudget !== undefined &&
      (!Number.isFinite(initialBudget) || initialBudget < 0)
    ) {
      throw this.validation(
        "Initial budget must be a non-negative finite number",
      );
    }
  }

  private validation(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }

  private forbidden(message: string): AppException {
    writeStructuredLog({
      level: "warn",
      event: "research.authorization.denied",
      message,
    });
    return new AppException({
      code: ErrorCode.Forbidden,
      status: HttpStatus.FORBIDDEN,
      message,
    });
  }
}
