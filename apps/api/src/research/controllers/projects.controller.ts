import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import type {
  ResearchOutputRecord,
  ResearchProjectStatus,
} from "@ihepsrs/contracts";

import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import { ProjectService } from "../domain/project.service";

@AuthenticatedOnly()
@Controller("research/projects")
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  getAllProjects(@Req() request: AuthorizationAwareRequest) {
    return this.projectService.getAllProjects(request.authorizationPrincipal!);
  }

  @Get(":id")
  getProject(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.getProject(id, request.authorizationPrincipal!);
  }

  @Post("direct")
  createDirectProject(
    @Body()
    dto: {
      leaderId: string;
      institutionId: string;
      title: string;
      startDate: string;
      endDate?: string;
      adminReason: string;
      adminDecisionRef: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.createDirectProject(
      dto,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/transition")
  transitionProject(
    @Param("id") id: string,
    @Body()
    dto: {
      targetStatus: ResearchProjectStatus;
      startDate?: string;
      endDate?: string;
      amendmentId?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.transitionProject(
      id,
      dto.targetStatus,
      request.authorizationPrincipal!,
      dto,
    );
  }

  @Get(":id/amendments")
  getAmendments(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.getProjectAmendments(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/amendments")
  requestAmendment(
    @Param("id") id: string,
    @Body()
    dto: {
      changeType: "Leader" | "Scope" | "Duration" | "Reopen";
      reason: string;
      newLeaderId?: string;
      newEndDate?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.requestAmendment(
      { ...dto, projectId: id },
      request.authorizationPrincipal!,
    );
  }

  @Post("amendments/:amendmentId/review")
  beginAmendmentReview(
    @Param("amendmentId") amendmentId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.beginAmendmentReview(
      amendmentId,
      request.authorizationPrincipal!,
    );
  }

  @Post("amendments/:amendmentId/decision")
  decideAmendment(
    @Param("amendmentId") amendmentId: string,
    @Body() dto: { decision: "Approved" | "Rejected" },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.decideAmendment(
      amendmentId,
      dto.decision,
      request.authorizationPrincipal!,
    );
  }

  @Post("amendments/:amendmentId/apply")
  applyAmendment(
    @Param("amendmentId") amendmentId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.applyAmendment(
      amendmentId,
      request.authorizationPrincipal!,
    );
  }

  @Get(":id/outputs")
  getOutputs(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.getProjectOutputs(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/outputs")
  registerOutput(
    @Param("id") id: string,
    @Body()
    dto: {
      outputType: ResearchOutputRecord["outputType"];
      title: string;
      documentId?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.registerOutput(
      { ...dto, projectId: id },
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/outputs/:outputId/accept")
  acceptOutput(
    @Param("id") id: string,
    @Param("outputId") outputId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.projectService.acceptOutput(
      id,
      outputId,
      request.authorizationPrincipal!,
    );
  }
}
