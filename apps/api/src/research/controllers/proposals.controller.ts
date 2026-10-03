import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ProposalService } from "../domain/proposal.service";
import { AssignReviewerDto } from "@ihepsrs/contracts";

@Controller("research/proposals")
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @Get()
  getAllProposals() {
    return this.proposalService.getAllProposals();
  }

  @Get(":id")
  getProposal(@Param("id") id: string) {
    return this.proposalService.getProposal(id);
  }

  @Post()
  createProposal(@Body() dto: { principalResearcherId: string; title: string; abstract: string; initialBudget?: number }) {
    return this.proposalService.createProposal(dto);
  }

  @Post(":id/submit")
  submitProposal(@Param("id") id: string) {
    return this.proposalService.submitProposal(id);
  }

  @Get(":id/reviews")
  getReviews(@Param("id") id: string) {
    return this.proposalService.getReviewsForProposal(id);
  }

  @Post(":id/reviewers")
  assignReviewer(@Param("id") id: string, @Body() dto: Omit<AssignReviewerDto, "proposalId">) {
    return this.proposalService.assignReviewer({ ...dto, proposalId: id });
  }

  @Post("reviews/:reviewId/score")
  submitReview(
    @Param("reviewId") reviewId: string,
    @Body() dto: { score: number; recommendation: "Approve" | "Reject" | "Revision"; comments?: string },
  ) {
    return this.proposalService.submitReview({ ...dto, reviewId });
  }

  @Post(":id/decision")
  issueDecision(
    @Param("id") id: string,
    @Body() dto: { decision: "Approved" | "Rejected"; decisionByResearcherId: string; reason?: string },
  ) {
    return this.proposalService.issueDecision({ ...dto, proposalId: id });
  }
}
