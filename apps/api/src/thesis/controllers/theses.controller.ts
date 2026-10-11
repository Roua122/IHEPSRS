import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";

import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { ThesisEntityService } from "../domain/thesis-entity.service";

/** TH001: safe domain operations; no client-writable status or version numbers. */
@AuthenticatedOnly()
@Controller("theses")
export class ThesesController {
  constructor(private readonly theses: ThesisEntityService) {}

  @Post()
  createDraft(
    @Body() body: { enrollmentId: string; titleAr: string; titleEn?: string; abstract?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.createDraft(body, request.authorizationPrincipal!);
  }

  @Get("by-enrollment/:enrollmentId")
  listByEnrollment(
    @Param("enrollmentId") enrollmentId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.listByEnrollment(enrollmentId, request.authorizationPrincipal!);
  }

  @Get(":thesisId")
  getOne(@Param("thesisId") thesisId: string, @Req() request: AuthorizationAwareRequest) {
    return this.theses.getOne(thesisId, request.authorizationPrincipal!);
  }

  @Post(":thesisId/register")
  register(@Param("thesisId") thesisId: string, @Req() request: AuthorizationAwareRequest) {
    return this.theses.register(thesisId, request.authorizationPrincipal!);
  }

  @Post(":thesisId/versions/proposal")
  addProposalVersion(
    @Param("thesisId") thesisId: string,
    @Body() body: { titleAr: string; titleEn?: string; abstract?: string; documentLinkId?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.addProposalVersion(thesisId, body, request.authorizationPrincipal!);
  }


  /** TH003 / UC-07: no direct status mutation endpoints. */
  @Post(":thesisId/proposal/submit")
  submitProposal(
    @Param("thesisId") thesisId: string,
    @Body() body: { proposalVersionId: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.submitProposal(thesisId, body, request.authorizationPrincipal!);
  }

  @Post(":thesisId/proposal/supervisor-review")
  reviewProposalAsSupervisor(
    @Param("thesisId") thesisId: string,
    @Body() body: { proposalVersionId: string; approve: boolean; reason?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.reviewProposalAsSupervisor(thesisId, body, request.authorizationPrincipal!);
  }

  @Post(":thesisId/proposal/return")
  returnProposal(
    @Param("thesisId") thesisId: string,
    @Body() body: { proposalVersionId: string; reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.returnProposal(thesisId, body, request.authorizationPrincipal!);
  }

  @Post(":thesisId/proposal/approve")
  approveProposal(
    @Param("thesisId") thesisId: string,
    @Body() body: { proposalVersionId: string; reason?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.approveProposal(thesisId, body, request.authorizationPrincipal!);
  }

  @Post(":thesisId/proposal/start-work")
  beginThesisWork(
    @Param("thesisId") thesisId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.beginThesisWork(thesisId, request.authorizationPrincipal!);
  }

  @Get(":thesisId/proposal/reviews")
  proposalReviews(
    @Param("thesisId") thesisId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.proposalReviews(thesisId, request.authorizationPrincipal!);
  }

  /** TH004 / UC-08: append a final, independently numbered ThesisVersion. */
  @Post(":thesisId/submission/versions")
  addSubmissionVersion(
    @Param("thesisId") thesisId: string,
    @Body() body: { documentLinkId: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.addSubmissionVersion(thesisId, body, request.authorizationPrincipal!);
  }

  /** TH004: readiness can only be confirmed by the currently assigned Main supervisor. */
  @Post(":thesisId/submission/supervisor-confirm")
  confirmSubmissionReadiness(
    @Param("thesisId") thesisId: string,
    @Body() body: { submissionVersionId: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.confirmSubmissionReadiness(thesisId, body, request.authorizationPrincipal!);
  }

  /** TH004: only an explicit, validated InProgress -> Submitted transition. */
  @Post(":thesisId/submission/submit")
  submitThesis(
    @Param("thesisId") thesisId: string,
    @Body() body: { submissionVersionId: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.submitThesis(thesisId, body, request.authorizationPrincipal!);
  }

  @Get(":thesisId/submission/confirmations")
  submissionConfirmations(
    @Param("thesisId") thesisId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.submissionConfirmations(thesisId, request.authorizationPrincipal!);
  }

  @Get(":thesisId/versions")
  versions(@Param("thesisId") thesisId: string, @Req() request: AuthorizationAwareRequest) {
    return this.theses.versions(thesisId, request.authorizationPrincipal!);
  }

  @Get(":thesisId/status-as-of")
  statusAsOf(
    @Param("thesisId") thesisId: string,
    @Query("at") at: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.statusAsOf(thesisId, at, request.authorizationPrincipal!);
  }

  @Post(":thesisId/progress")
  addProgress(
    @Param("thesisId") thesisId: string,
    @Body() body: { periodFrom: string; periodTo: string; studentSummary: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.appendStudentProgress(thesisId, body, request.authorizationPrincipal!);
  }

  @Get(":thesisId/progress")
  getProgress(@Param("thesisId") thesisId: string, @Req() request: AuthorizationAwareRequest) {
    return this.theses.progressReports(thesisId, request.authorizationPrincipal!);
  }

  @Post(":thesisId/title-amendments")
  requestTitleAmendment(
    @Param("thesisId") thesisId: string,
    @Body() body: { titleAr: string; titleEn?: string; reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.requestTitleAmendment(thesisId, body, request.authorizationPrincipal!);
  }

  @Get(":thesisId/title-amendments")
  amendments(@Param("thesisId") thesisId: string, @Req() request: AuthorizationAwareRequest) {
    return this.theses.titleAmendments(thesisId, request.authorizationPrincipal!);
  }

  @Post(":thesisId/title-amendments/:amendmentId/decision")
  decideTitleAmendment(
    @Param("thesisId") thesisId: string,
    @Param("amendmentId") amendmentId: string,
    @Body() body: { approve: boolean; reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.theses.decideTitleAmendment(
      thesisId, amendmentId, body, request.authorizationPrincipal!,
    );
  }
}
