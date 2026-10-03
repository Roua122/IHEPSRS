import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ResearchProposalRecord,
  ProposalReviewRecord,
  AssignReviewerDto,
  ResearchProposalStatus,
} from "@ihepsrs/contracts";
import { writeStructuredLog } from "../../common/observability/structured-log";
import { PersonIdentityService } from "./person-identity.service";
import { ProjectService } from "./project.service";

@Injectable()
export class ProposalService {
  private proposals = new Map<string, ResearchProposalRecord>();
  private reviews = new Map<string, ProposalReviewRecord[]>();

  constructor(
    private readonly identityService: PersonIdentityService,
    private readonly projectService: ProjectService,
  ) {
    this.seedInitialData();
  }

  private seedInitialData() {
    const prop1: ResearchProposalRecord = {
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
    this.proposals.set(prop1.proposalId, prop1);
    this.reviews.set(prop1.proposalId, []);
  }

  createProposal(dto: {
    principalResearcherId: string;
    title: string;
    abstract: string;
    initialBudget?: number;
  }): ResearchProposalRecord {
    const researcher = this.identityService.getResearcher(
      dto.principalResearcherId,
    );
    if (!researcher) {
      throw new NotFoundException(
        `Principal Researcher ${dto.principalResearcherId} not found`,
      );
    }

    const proposalId = `PROP-${Date.now()}`;
    const proposal: ResearchProposalRecord = {
      proposalId,
      principalResearcherId: dto.principalResearcherId,
      title: dto.title,
      abstract: dto.abstract,
      initialBudget: dto.initialBudget,
      status: "Draft",
    };

    this.proposals.set(proposalId, proposal);
    this.reviews.set(proposalId, []);

    writeStructuredLog({
      level: "info",
      event: "research.proposal.created",
      message: `Proposal ${proposalId} created by researcher ${dto.principalResearcherId}`,
      proposalId,
      principalResearcherId: dto.principalResearcherId,
    });

    return proposal;
  }

  submitProposal(proposalId: string): ResearchProposalRecord {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    if (
      proposal.status !== "Draft" &&
      proposal.status !== "RevisionRequested"
    ) {
      throw new BadRequestException(
        `Cannot submit proposal in status ${proposal.status}`,
      );
    }

    const updated: ResearchProposalRecord = {
      ...proposal,
      status: "Submitted",
      submittedAt: new Date().toISOString(),
    };

    this.proposals.set(proposalId, updated);

    writeStructuredLog({
      level: "info",
      event: "research.proposal.submitted",
      proposalId,
      status: updated.status,
    });

    return updated;
  }

  // --- BR-021, BR-022, BR-061: Conflict of Interest (COI) Check & Reviewer Assignment ---
  assignReviewer(dto: AssignReviewerDto): ProposalReviewRecord {
    const proposal = this.proposals.get(dto.proposalId);
    if (!proposal) {
      throw new NotFoundException(`Proposal ${dto.proposalId} not found`);
    }

    const reviewer = this.identityService.getResearcher(dto.reviewerId);
    if (!reviewer) {
      throw new NotFoundException(`Reviewer ${dto.reviewerId} not found`);
    }

    const piResearcher = this.identityService.getResearcher(
      proposal.principalResearcherId,
    );

    // COI Rule 1 (BR-021 & BR-061): Proposer cannot review their own proposal (Self-Review)
    if (
      dto.reviewerId === proposal.principalResearcherId ||
      (piResearcher && reviewer.personId === piResearcher.personId)
    ) {
      writeStructuredLog({
        level: "warn",
        event: "research.coi.blocked",
        message: `Self-review blocked for proposal ${proposal.proposalId}`,
        proposalId: proposal.proposalId,
        reviewerId: dto.reviewerId,
        rule: "BR-021/BR-061: Self-Review",
      });
      throw new ForbiddenException(
        "BR-021 / BR-061: Proposer cannot be assigned as reviewer to their own proposal (Conflict of Interest)",
      );
    }

    // COI Rule 2 (BR-061): Manual conflict disclosure or same department / direct relation
    let isConflict = false;
    let conflictReason = "";

    if (dto.hasDeclaredConflict) {
      isConflict = true;
      conflictReason = "Manual Conflict Disclosure declared";
    } else if (
      piResearcher &&
      piResearcher.institutionId === reviewer.institutionId &&
      piResearcher.department &&
      piResearcher.department === reviewer.department
    ) {
      isConflict = true;
      conflictReason = "BR-061: Same department membership conflict";
    }

    const reviewId = `REV-${Date.now()}`;
    const reviewRecord: ProposalReviewRecord = {
      reviewId,
      proposalId: dto.proposalId,
      reviewerId: dto.reviewerId,
      conflictStatus: isConflict ? "Conflict" : "Clear",
      conflictReason: isConflict ? conflictReason : undefined,
    };

    const existingReviews = this.reviews.get(dto.proposalId) || [];
    existingReviews.push(reviewRecord);
    this.reviews.set(dto.proposalId, existingReviews);

    // Update proposal status to UnderReview if cleared and valid
    if (proposal.status === "Submitted" || proposal.status === "Screening") {
      this.proposals.set(dto.proposalId, {
        ...proposal,
        status: "UnderReview",
      });
    }

    writeStructuredLog({
      level: "info",
      event: "research.proposal.reviewer_assigned",
      proposalId: dto.proposalId,
      reviewerId: dto.reviewerId,
      conflictStatus: reviewRecord.conflictStatus,
    });

    return reviewRecord;
  }

  // --- BR-022: Prevent Conflicted Reviewer from Submitting Review ---
  submitReview(dto: {
    reviewId: string;
    score: number;
    recommendation: "Approve" | "Reject" | "Revision";
    comments?: string;
  }): ProposalReviewRecord {
    let targetProposalId: string | undefined;
    let targetReviewIndex = -1;
    let targetReview: ProposalReviewRecord | undefined;

    for (const [propId, revList] of this.reviews.entries()) {
      const idx = revList.findIndex((r) => r.reviewId === dto.reviewId);
      if (idx !== -1) {
        targetProposalId = propId;
        targetReviewIndex = idx;
        targetReview = revList[idx];
        break;
      }
    }

    if (!targetReview || !targetProposalId) {
      throw new NotFoundException(`Review record ${dto.reviewId} not found`);
    }

    // BR-022: Conflicted reviewer is blocked from proceeding with evaluation
    if (targetReview.conflictStatus === "Conflict") {
      throw new ForbiddenException(
        `BR-022: Reviewer is conflicted (${targetReview.conflictReason}) and blocked from submitting evaluation`,
      );
    }

    const updatedReview: ProposalReviewRecord = {
      ...targetReview,
      score: dto.score,
      recommendation: dto.recommendation,
      comments: dto.comments,
      reviewedAt: new Date().toISOString(),
    };

    const revList = this.reviews.get(targetProposalId)!;
    revList[targetReviewIndex] = updatedReview;

    writeStructuredLog({
      level: "info",
      event: "research.proposal.review_submitted",
      reviewId: dto.reviewId,
      proposalId: targetProposalId,
      recommendation: dto.recommendation,
    });

    return updatedReview;
  }

  // --- BR-021 & BR-049: Proposal Decision & Auto Project Creation ---
  issueDecision(dto: {
    proposalId: string;
    decision: "Approved" | "Rejected";
    decisionByResearcherId: string;
    reason?: string;
  }): ResearchProposalRecord {
    const proposal = this.proposals.get(dto.proposalId);
    if (!proposal) {
      throw new NotFoundException(`Proposal ${dto.proposalId} not found`);
    }

    // BR-021: Decision cannot be issued by the proposal's PI
    if (proposal.principalResearcherId === dto.decisionByResearcherId) {
      throw new ForbiddenException(
        "BR-021: Proposal PI cannot issue approval decision on their own proposal",
      );
    }

    let createdProjectId: string | undefined;

    // BR-049: Approved proposal automatically creates 1 default Research Project
    if (dto.decision === "Approved") {
      const piResearcher = this.identityService.getResearcher(
        proposal.principalResearcherId,
      );
      const institutionId = piResearcher
        ? piResearcher.institutionId
        : "INST-001";

      const createdProject =
        this.projectService.createProjectFromApprovedProposal({
          proposalId: proposal.proposalId,
          leaderId: proposal.principalResearcherId,
          institutionId,
          title: proposal.title,
        });

      createdProjectId = createdProject.projectId;
    }

    const updated: ResearchProposalRecord = {
      ...proposal,
      status: dto.decision === "Approved" ? "Approved" : "Rejected",
      decision: dto.decision,
      decisionAt: new Date().toISOString(),
      createdProjectId,
    };

    this.proposals.set(dto.proposalId, updated);

    writeStructuredLog({
      level: "info",
      event: "research.proposal.decision_issued",
      proposalId: dto.proposalId,
      decision: dto.decision,
      createdProjectId,
    });

    return updated;
  }

  getProposal(proposalId: string): ResearchProposalRecord {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }
    return proposal;
  }

  getReviewsForProposal(proposalId: string): ProposalReviewRecord[] {
    return this.reviews.get(proposalId) || [];
  }

  getAllProposals(): ResearchProposalRecord[] {
    return Array.from(this.proposals.values());
  }
}
