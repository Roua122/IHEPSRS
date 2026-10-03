import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ResearchProjectRecord,
  AmendmentRequestRecord,
  ResearchOutputRecord,
  ResearchProjectStatus,
} from "@ihepsrs/contracts";
import { writeStructuredLog } from "../../common/observability/structured-log";

@Injectable()
export class ProjectService {
  private projects = new Map<string, ResearchProjectRecord>();
  private amendments = new Map<string, AmendmentRequestRecord[]>();
  private outputs = new Map<string, ResearchOutputRecord[]>();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const proj1: ResearchProjectRecord = {
      projectId: "PROJ-101",
      proposalId: "PROP-100",
      leaderId: "RES-101",
      institutionId: "INST-001",
      title: "National Academic Repository Integration Protocol",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "Active",
    };
    this.projects.set(proj1.projectId, proj1);
    this.amendments.set(proj1.projectId, []);

    const output1: ResearchOutputRecord = {
      outputId: "OUT-101",
      projectId: "PROJ-101",
      outputType: "Prototype",
      title: "Interoperable Micro-service API Prototype",
      status: "Accepted",
      completedAt: "2026-06-30T12:00:00Z",
    };
    this.outputs.set(proj1.projectId, [output1]);
  }

  // --- BR-049: Creation via Approved Proposal ---
  createProjectFromApprovedProposal(params: {
    proposalId: string;
    leaderId: string;
    institutionId: string;
    title: string;
  }): ResearchProjectRecord {
    const projectId = `PROJ-${Date.now()}`;
    const project: ResearchProjectRecord = {
      projectId,
      proposalId: params.proposalId,
      leaderId: params.leaderId,
      institutionId: params.institutionId,
      title: params.title,
      startDate: new Date().toISOString().split("T")[0],
      status: "Active",
    };

    this.projects.set(projectId, project);
    this.amendments.set(projectId, []);
    this.outputs.set(projectId, []);

    writeStructuredLog({
      level: "info",
      event: "research.project.created_from_proposal",
      projectId,
      proposalId: params.proposalId,
    });

    return project;
  }

  // --- BR-020 & BR-049: Direct Admin Project Creation ---
  createDirectProject(dto: {
    leaderId: string;
    institutionId: string;
    title: string;
    startDate: string;
    endDate?: string;
    adminReason: string;
    adminDecisionRef: string;
  }): ResearchProjectRecord {
    // BR-020: Project must have at least 1 Leader and valid date range
    if (!dto.leaderId?.trim()) {
      throw new BadRequestException(
        "BR-020: Project must have at least one Principal Investigator (Leader)",
      );
    }
    if (dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException(
        "BR-020: Project endDate must be on or after startDate",
      );
    }

    // BR-049: Direct creation without proposal requires admin reason & decision
    if (!dto.adminReason?.trim() || !dto.adminDecisionRef?.trim()) {
      throw new BadRequestException(
        "BR-049: Creating a project without an approved proposal requires authorized admin reason and decision reference",
      );
    }

    const projectId = `PROJ-${Date.now()}`;
    const project: ResearchProjectRecord = {
      projectId,
      leaderId: dto.leaderId,
      institutionId: dto.institutionId,
      title: dto.title,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: "Active",
    };

    this.projects.set(projectId, project);
    this.amendments.set(projectId, []);
    this.outputs.set(projectId, []);

    writeStructuredLog({
      level: "info",
      event: "research.project.created_direct_admin",
      projectId,
      leaderId: dto.leaderId,
      adminReason: dto.adminReason,
      adminDecisionRef: dto.adminDecisionRef,
    });

    return project;
  }

  // --- BR-050: Amendment Requests for Leader / Scope / Duration Changes ---
  requestAmendment(dto: {
    projectId: string;
    requestedBy: string;
    type: "LeaderChange" | "ScopeChange" | "Extension";
    reason: string;
    newLeaderId?: string;
    newEndDate?: string;
  }): AmendmentRequestRecord {
    const project = this.projects.get(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found`);
    }

    if (project.status !== "Active" && project.status !== "OnHold") {
      throw new BadRequestException(
        `Cannot request amendment for project in status ${project.status}`,
      );
    }

    const amendmentId = `AMD-${Date.now()}`;
    const amendment: AmendmentRequestRecord = {
      amendmentId,
      projectId: dto.projectId,
      requestedBy: dto.requestedBy,
      type: dto.type,
      reason: dto.reason,
      newLeaderId: dto.newLeaderId,
      newEndDate: dto.newEndDate,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    const projectAmendments = this.amendments.get(dto.projectId) || [];
    projectAmendments.push(amendment);
    this.amendments.set(dto.projectId, projectAmendments);

    writeStructuredLog({
      level: "info",
      event: "research.project.amendment_requested",
      amendmentId,
      projectId: dto.projectId,
      type: dto.type,
    });

    return amendment;
  }

  decideAmendment(dto: {
    amendmentId: string;
    decision: "Approved" | "Rejected";
    decidedBy: string;
  }): AmendmentRequestRecord {
    let targetProjectId: string | undefined;
    let targetIndex = -1;
    let targetAmendment: AmendmentRequestRecord | undefined;

    for (const [pId, list] of this.amendments.entries()) {
      const idx = list.findIndex((a) => a.amendmentId === dto.amendmentId);
      if (idx !== -1) {
        targetProjectId = pId;
        targetIndex = idx;
        targetAmendment = list[idx];
        break;
      }
    }

    if (!targetAmendment || !targetProjectId) {
      throw new NotFoundException(
        `Amendment request ${dto.amendmentId} not found`,
      );
    }

    const project = this.projects.get(targetProjectId)!;

    const updatedAmendment: AmendmentRequestRecord = {
      ...targetAmendment,
      status: dto.decision,
      decidedAt: new Date().toISOString(),
    };

    // Apply changes if Approved (BR-050 preserves history by recording amendment record)
    if (dto.decision === "Approved") {
      if (
        targetAmendment.type === "LeaderChange" &&
        targetAmendment.newLeaderId
      ) {
        this.projects.set(targetProjectId, {
          ...project,
          leaderId: targetAmendment.newLeaderId,
        });
      } else if (
        targetAmendment.type === "Extension" &&
        targetAmendment.newEndDate
      ) {
        this.projects.set(targetProjectId, {
          ...project,
          endDate: targetAmendment.newEndDate,
        });
      }
    }

    const list = this.amendments.get(targetProjectId)!;
    list[targetIndex] = updatedAmendment;

    writeStructuredLog({
      level: "info",
      event: "research.project.amendment_decided",
      amendmentId: dto.amendmentId,
      decision: dto.decision,
      projectId: targetProjectId,
    });

    return updatedAmendment;
  }

  // --- FR-027: Register Research Outputs ---
  registerOutput(dto: {
    projectId: string;
    outputType: "Dataset" | "Report" | "Prototype" | "Publication" | "Other";
    title: string;
    documentId?: string;
  }): ResearchOutputRecord {
    const project = this.projects.get(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found`);
    }

    const outputId = `OUT-${Date.now()}`;
    const output: ResearchOutputRecord = {
      outputId,
      projectId: dto.projectId,
      outputType: dto.outputType,
      title: dto.title,
      status: "Accepted",
      documentId: dto.documentId,
      completedAt: new Date().toISOString(),
    };

    const projectOutputs = this.outputs.get(dto.projectId) || [];
    projectOutputs.push(output);
    this.outputs.set(dto.projectId, projectOutputs);

    writeStructuredLog({
      level: "info",
      event: "research.output.registered",
      outputId,
      projectId: dto.projectId,
      outputType: dto.outputType,
    });

    return output;
  }

  // --- UC-11 & State Transitions: Project Completion Verification ---
  updateProjectStatus(
    projectId: string,
    newStatus: ResearchProjectStatus,
  ): ResearchProjectRecord {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // UC-11: Cannot mark project as Completed unless mandatory required fields and at least 1 accepted output are present
    if (newStatus === "Completed") {
      const projectOutputs = this.outputs.get(projectId) || [];
      const hasAcceptedOutputs = projectOutputs.some(
        (o) => o.status === "Accepted",
      );

      if (!hasAcceptedOutputs) {
        throw new BadRequestException(
          "UC-11: Cannot complete project without at least one registered and accepted research output",
        );
      }
    }

    const updated: ResearchProjectRecord = {
      ...project,
      status: newStatus,
    };

    this.projects.set(projectId, updated);

    writeStructuredLog({
      level: "info",
      event: "research.project.status_updated",
      projectId,
      status: newStatus,
    });

    return updated;
  }

  getProject(projectId: string): ResearchProjectRecord {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  getProjectAmendments(projectId: string): AmendmentRequestRecord[] {
    return this.amendments.get(projectId) || [];
  }

  getProjectOutputs(projectId: string): ResearchOutputRecord[] {
    return this.outputs.get(projectId) || [];
  }

  getAllProjects(): ResearchProjectRecord[] {
    return Array.from(this.projects.values());
  }
}
