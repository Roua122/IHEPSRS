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
