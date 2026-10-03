import { Controller, Get, Post, Body, Param, Patch } from "@nestjs/common";
import { ProjectService } from "../domain/project.service";
import { ResearchProjectStatus } from "@ihepsrs/contracts";

@Controller("research/projects")
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  getAllProjects() {
    return this.projectService.getAllProjects();
  }

  @Get(":id")
  getProject(@Param("id") id: string) {
    return this.projectService.getProject(id);
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
  ) {
    return this.projectService.createDirectProject(dto);
  }

  @Patch(":id/status")
  updateProjectStatus(
    @Param("id") id: string,
    @Body() dto: { status: ResearchProjectStatus },
  ) {
    return this.projectService.updateProjectStatus(id, dto.status);
  }

  @Get(":id/amendments")
  getAmendments(@Param("id") id: string) {
    return this.projectService.getProjectAmendments(id);
  }

  @Post(":id/amendments")
  requestAmendment(
    @Param("id") id: string,
    @Body()
    dto: {
      requestedBy: string;
      type: "LeaderChange" | "ScopeChange" | "Extension";
      reason: string;
      newLeaderId?: string;
      newEndDate?: string;
    },
  ) {
    return this.projectService.requestAmendment({ ...dto, projectId: id });
  }

  @Post("amendments/:amendmentId/decision")
  decideAmendment(
    @Param("amendmentId") amendmentId: string,
    @Body() dto: { decision: "Approved" | "Rejected"; decidedBy: string },
  ) {
    return this.projectService.decideAmendment({ ...dto, amendmentId });
  }

  @Get(":id/outputs")
  getOutputs(@Param("id") id: string) {
    return this.projectService.getProjectOutputs(id);
  }

  @Post(":id/outputs")
  registerOutput(
    @Param("id") id: string,
    @Body()
    dto: {
      outputType: "Dataset" | "Report" | "Prototype" | "Publication" | "Other";
      title: string;
      documentId?: string;
    },
  ) {
    return this.projectService.registerOutput({ ...dto, projectId: id });
  }
}
