import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";

import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import type { ApplicationEditableField } from "../domain/academic.types";
import { ApplicationWorkflowService } from "../domain/application-workflow.service";

/** FR-010, BR-006/041: only operation-driven transitions, not status PATCH. */
@AuthenticatedOnly()
@Controller("postgraduate/applications")
export class ApplicationsController {
  constructor(private readonly workflow: ApplicationWorkflowService) {}

  @Post()
  createDraft(
    @Body() body: { programId: string; admissionCycleId: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.createDraft(body, request.authorizationPrincipal!);
  }

  @Get("self")
  listMine(@Req() request: AuthorizationAwareRequest) {
    return this.workflow.listMine(request.authorizationPrincipal!);
  }

  @Get("review/assigned")
  listAssignedToMe(
    @Query("institutionId") institutionId: string,
    @Query("programId") programId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.listAssignedToMe(
      institutionId,
      programId,
      request.authorizationPrincipal!,
    );
  }

  @Get("officer")
  listForOfficer(
    @Query("institutionId") institutionId: string,
    @Query("programId") programId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.listForOfficer(
      institutionId,
      programId,
      request.authorizationPrincipal!,
    );
  }

  @Get(":applicationId")
  getOne(
    @Param("applicationId") applicationId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.getOne(applicationId, request.authorizationPrincipal!);
  }

  @Patch(":applicationId")
  correctDraft(
    @Param("applicationId") applicationId: string,
    @Body() body: { programId?: string; admissionCycleId?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.correctFields(
      applicationId,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Post(":applicationId/documents")
  attachDocument(
    @Param("applicationId") applicationId: string,
    @Body() body: { documentId: string; purpose: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    // Never trust client-provided scanStatus, downloadUrl, documentOwner or isAvailable.
    return this.workflow.linkDocument(
      applicationId,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Post(":applicationId/submit")
  submit(
    @Param("applicationId") applicationId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.submitDraft(
      applicationId,
      request.authorizationPrincipal!,
    );
  }

  @Post(":applicationId/review/start")
  startReview(
    @Param("applicationId") applicationId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.startReview(
      applicationId,
      request.authorizationPrincipal!,
    );
  }

  /** TASK-PG-003 / FR-011: recommendation and notes are reviewer-only. */
  @Post(":applicationId/review")
  recordReview(
    @Param("applicationId") applicationId: string,
    @Body()
    body: {
      reviewType: "Eligibility" | "Academic";
      recommendation?: "Approve" | "Reject";
      comments?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.recordReview(
      applicationId,
      body,
      request.authorizationPrincipal!,
    );
  }

  /** TASK-PG-003 / FR-012: PGA alone makes a formal decision. */
  @Post(":applicationId/decision")
  decide(
    @Param("applicationId") applicationId: string,
    @Body()
    body: {
      outcome: "Accepted" | "Rejected" | "ConditionalAccepted";
      reason: string;
      conditions?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.decide(
      applicationId,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Post(":applicationId/decision/conditions/clear")
  clearAdmissionConditions(
    @Param("applicationId") applicationId: string,
    @Body() body: { clearanceEvidence: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.clearAdmissionConditions(
      applicationId,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Get(":applicationId/review/timing")
  reviewTiming(
    @Param("applicationId") applicationId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.getReviewTiming(
      applicationId,
      request.authorizationPrincipal!,
    );
  }

  @Post(":applicationId/review/need-more-info")
  requestMoreInfo(
    @Param("applicationId") applicationId: string,
    @Body()
    body: {
      reason: string;
      requestedFields?: ApplicationEditableField[];
      requestedDocumentPurposes?: string[];
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.requestMoreInfo(
      applicationId,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Post(":applicationId/resubmit")
  resubmit(
    @Param("applicationId") applicationId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.workflow.resubmit(
      applicationId,
      request.authorizationPrincipal!,
    );
  }
}
