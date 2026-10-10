import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { AssignReviewerDto } from "@ihepsrs/contracts";

import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import { ProposalService } from "../domain/proposal.service";

@AuthenticatedOnly()
@Controller("research/proposals")
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @Get()
  getAllProposals(@Req() request: AuthorizationAwareRequest) {
    return this.proposalService.getAllProposals(
      request.authorizationPrincipal!,
    );
  }

  @Get(":id")
  getProposal(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.getProposal(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post()
  createProposal(
    @Body()
    dto: {
      principalResearcherId: string;
      title: string;
      abstract: string;
      initialBudget?: number;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.createProposal(
      dto,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/submit")
  submitProposal(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.submitProposal(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/screen")
  screenProposal(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.screenProposal(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Get(":id/reviews")
  getReviews(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.getReviewsForProposal(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/reviewers")
  assignReviewer(
    @Param("id") id: string,
    @Body() dto: Omit<AssignReviewerDto, "proposalId">,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.assignReviewer(
      { ...dto, proposalId: id },
      request.authorizationPrincipal!,
    );
  }

  @Post("reviews/:reviewId/score")
  submitReview(
    @Param("reviewId") reviewId: string,
    @Body()
    dto: {
      score: number;
      recommendation: "Approve" | "Reject" | "Revision";
      comments?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.submitReview(
      { ...dto, reviewId },
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/revision")
  requestRevision(
    @Param("id") id: string,
    @Body() dto: { reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.requestRevision(
      id,
      dto.reason,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/withdraw")
  withdrawProposal(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.withdrawProposal(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/decision")
  issueDecision(
    @Param("id") id: string,
    @Body() dto: { decision: "Approved" | "Rejected"; reason?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.proposalService.issueDecision(
      { ...dto, proposalId: id },
      request.authorizationPrincipal!,
    );
  }
}
