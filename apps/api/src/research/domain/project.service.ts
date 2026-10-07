import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  AmendmentRequestRecord,
  ResearchOutputRecord,
  ResearchProjectRecord,
  ResearchProjectStatus,
} from "@ihepsrs/contracts";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { ResearchAuditService } from "./research-audit.service";
import { ResearchAuthorizationService } from "./research-authorization.service";

interface AmendmentPayload {
  newLeaderId?: string;
  newEndDate?: string;
}

const PROJECT_TRANSITIONS: Readonly<
  Record<ResearchProjectStatus, readonly ResearchProjectStatus[]>
> = {
  Planned: ["Active", "Terminated"],
  Active: ["OnHold", "Completed", "Terminated"],
  OnHold: ["Active", "Completed", "Terminated"],
  Completed: ["Reopened", "Archived"],
  Reopened: ["Active", "Terminated"],
  Terminated: ["Archived"],
  Archived: [],
};

@Injectable()
export class ProjectService {
  private readonly projects = new Map<string, ResearchProjectRecord>();
  private readonly amendments = new Map<string, AmendmentRequestRecord[]>();
  private readonly amendmentPayloads = new Map<string, AmendmentPayload>();
  private readonly outputs = new Map<string, ResearchOutputRecord[]>();

  constructor(
    private readonly authorization: ResearchAuthorizationService,
    private readonly audit: ResearchAuditService,
  ) {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const project: ResearchProjectRecord = {
      projectId: "PROJ-101",
      proposalId: "PROP-100",
      leaderId: "RES-101",
      institutionId: "INST-001",
      title: "National Academic Repository Integration Protocol",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "Active",
    };
    this.projects.set(project.projectId, project);
    this.amendments.set(project.projectId, []);
    this.outputs.set(project.projectId, [
      {
        outputId: "OUT-101",
        projectId: project.projectId,
        outputType: "Prototype",
        title: "Interoperable Micro-service API Prototype",
        status: "Accepted",
        completedAt: "2026-06-30T12:00:00Z",
      },
    ]);
  }

  createProjectFromApprovedProposal(params: {
    proposalId: string;
    leaderId: string;
    institutionId: string;
    title: string;
    actorUserId: string;
  }): ResearchProjectRecord {
    const existing = Array.from(this.projects.values()).find(
      (project) => project.proposalId === params.proposalId,
    );
    if (existing) return { ...existing };

    if (!params.leaderId?.trim() || !params.institutionId?.trim()) {
      throw this.validation(
        "BR-020: Project leader and institution are required",
      );
    }

    const project: ResearchProjectRecord = {
      projectId: randomUUID(),
      proposalId: params.proposalId,
      leaderId: params.leaderId,
      institutionId: params.institutionId,
      title: params.title.trim(),
      startDate: new Date().toISOString().slice(0, 10),
      status: "Planned",
    };
    this.projects.set(project.projectId, project);
    this.amendments.set(project.projectId, []);
    this.outputs.set(project.projectId, []);
    this.audit.append({
      actorUserId: params.actorUserId,
      action: "research.project.created_from_proposal",
      entityType: "ResearchProject",
      entityId: project.projectId,
      metadata: { sourceId: "BR-049", proposalId: params.proposalId },
    });
    return { ...project };
  }

  createDirectProject(
    dto: {
      leaderId: string;
      institutionId: string;
      title: string;
      startDate: string;
      endDate?: string;
      adminReason: string;
      adminDecisionRef: string;
    },
    principal: AuthorizationPrincipal,
  ): ResearchProjectRecord {
    this.authorization.assertResearchDecision(principal, dto.institutionId);
    if (!dto.leaderId?.trim() || !dto.title?.trim()) {
      throw this.validation("BR-020: Project leader and title are required");
    }
    if (!dto.adminReason?.trim() || !dto.adminDecisionRef?.trim()) {
      throw this.validation(
        "BR-049: Direct project creation requires reason and decision reference",
      );
    }
    this.assertDateRange(dto.startDate, dto.endDate);

    const project: ResearchProjectRecord = {
      projectId: randomUUID(),
      leaderId: dto.leaderId.trim(),
      institutionId: dto.institutionId.trim(),
      title: dto.title.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: "Planned",
    };
    this.projects.set(project.projectId, project);
    this.amendments.set(project.projectId, []);
    this.outputs.set(project.projectId, []);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.project.created_direct_admin",
      entityType: "ResearchProject",
      entityId: project.projectId,
      metadata: {
        sourceId: "BR-049",
        reason: dto.adminReason.trim(),
        decisionRef: dto.adminDecisionRef.trim(),
      },
    });
    return { ...project };
  }

  transitionProject(
    projectId: string,
    targetStatus: ResearchProjectStatus,
    principal: AuthorizationPrincipal,
    options: {
      startDate?: string;
      endDate?: string;
      amendmentId?: string;
    } = {},
  ): ResearchProjectRecord {
    const project = this.requireProject(projectId);
    this.authorization.assertResearchOperation(
      principal,
      project.institutionId,
    );
    if (!PROJECT_TRANSITIONS[project.status].includes(targetStatus)) {
      throw this.validation(
        `ResearchProject transition ${project.status} -> ${targetStatus} is not allowed`,
      );
    }

    let next: ResearchProjectRecord = { ...project, status: targetStatus };
    if (project.status === "Planned" && targetStatus === "Active") {
      const startDate = options.startDate ?? project.startDate;
      const endDate = options.endDate ?? project.endDate;
      this.assertDateRange(startDate, endDate, true);
      next = { ...next, startDate, endDate };
    }

    if (targetStatus === "Completed") {
      this.assertProjectCompletable(projectId, next);
    }

    if (targetStatus === "Reopened") {
      const amendment = options.amendmentId
        ? this.findAmendment(options.amendmentId)
        : undefined;
      if (
        !amendment ||
        amendment.record.entityId !== projectId ||
        amendment.record.changeType !== "Reopen" ||
        amendment.record.status !== "Applied"
      ) {
        throw this.validation(
          "ResearchProject Reopened requires an applied Reopen AmendmentRequest",
        );
      }
    }

    this.projects.set(projectId, next);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.project.transitioned",
      entityType: "ResearchProject",
      entityId: projectId,
      metadata: {
        sourceId: "FR-024",
        from: project.status,
        to: targetStatus,
      },
    });
    return { ...next };
  }

  requestAmendment(
    dto: {
      projectId: string;
      changeType: "Leader" | "Scope" | "Duration" | "Reopen";
      reason: string;
      newLeaderId?: string;
      newEndDate?: string;
    },
    principal: AuthorizationPrincipal,
  ): AmendmentRequestRecord {
    const project = this.requireProject(dto.projectId);
    this.authorization.assertResearchOperation(
      principal,
      project.institutionId,
    );
    if (!dto.reason?.trim()) {
      throw this.validation("BR-050: Amendment reason is required");
    }
    if (dto.changeType === "Leader" && !dto.newLeaderId?.trim()) {
      throw this.validation("Leader amendment requires newLeaderId");
    }
    if (dto.changeType === "Duration") {
      this.assertDateRange(project.startDate, dto.newEndDate, true);
    }
    if (dto.changeType === "Reopen" && project.status !== "Completed") {
      throw this.validation("Reopen amendment requires a Completed project");
    }

    const amendment: AmendmentRequestRecord = {
      amendmentId: randomUUID(),
      entityType: "ResearchProject",
      entityId: dto.projectId,
      changeType: dto.changeType,
      requestedByUserId: principal.userId,
      reason: dto.reason.trim(),
      status: "Submitted",
    };
    const list = [...(this.amendments.get(dto.projectId) ?? []), amendment];
    this.amendments.set(dto.projectId, list);
    this.amendmentPayloads.set(amendment.amendmentId, {
      newLeaderId: dto.newLeaderId?.trim(),
      newEndDate: dto.newEndDate,
    });
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.project.amendment_requested",
      entityType: "AmendmentRequest",
      entityId: amendment.amendmentId,
      metadata: { sourceId: "BR-050", changeType: dto.changeType },
    });
    return { ...amendment };
  }

  beginAmendmentReview(
    amendmentId: string,
    principal: AuthorizationPrincipal,
  ): AmendmentRequestRecord {
    const located = this.findAmendment(amendmentId);
    const project = this.requireProject(located.projectId);
    this.authorization.assertResearchDecision(principal, project.institutionId);
    if (located.record.status !== "Submitted") {
      throw this.validation("Only Submitted amendment may enter UnderReview");
    }
    const updated = { ...located.record, status: "UnderReview" as const };
    this.replaceAmendment(located.projectId, located.index, updated);
    return { ...updated };
  }

  decideAmendment(
    amendmentId: string,
    decision: "Approved" | "Rejected",
    principal: AuthorizationPrincipal,
  ): AmendmentRequestRecord {
    const located = this.findAmendment(amendmentId);
    const project = this.requireProject(located.projectId);
    this.authorization.assertResearchDecision(principal, project.institutionId);
    if (located.record.status !== "UnderReview") {
      throw this.validation("Amendment decision requires UnderReview status");
    }
    const updated: AmendmentRequestRecord = {
      ...located.record,
      status: decision,
      decisionId: randomUUID(),
    };
    this.replaceAmendment(located.projectId, located.index, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.project.amendment_decided",
      entityType: "AmendmentRequest",
      entityId: amendmentId,
      metadata: { sourceId: "BR-050", decision },
    });
    return { ...updated };
  }

  applyAmendment(
    amendmentId: string,
    principal: AuthorizationPrincipal,
  ): AmendmentRequestRecord {
    const located = this.findAmendment(amendmentId);
    const project = this.requireProject(located.projectId);
    this.authorization.assertResearchDecision(principal, project.institutionId);
    if (located.record.status !== "Approved") {
      throw this.validation("Only Approved amendment can be applied");
    }
    const payload = this.amendmentPayloads.get(amendmentId) ?? {};
    let updatedProject = { ...project };
    if (located.record.changeType === "Leader") {
      if (!payload.newLeaderId)
        throw this.validation("Leader amendment payload is incomplete");
      updatedProject = { ...updatedProject, leaderId: payload.newLeaderId };
    } else if (located.record.changeType === "Duration") {
      this.assertDateRange(project.startDate, payload.newEndDate, true);
      updatedProject = { ...updatedProject, endDate: payload.newEndDate };
    }
    // Scope changes are deliberately recorded but not given invented fields in the canonical project model.
    // Reopen is consumed by the explicit Completed -> Reopened transition.

    const applied: AmendmentRequestRecord = {
      ...located.record,
      status: "Applied",
    };
    // NFR-014 prototype atomicity: all validation completes before either record is committed.
    this.projects.set(project.projectId, updatedProject);
    this.replaceAmendment(located.projectId, located.index, applied);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.project.amendment_applied",
      entityType: "AmendmentRequest",
      entityId: amendmentId,
      metadata: { sourceId: "BR-050", changeType: applied.changeType },
    });
    return { ...applied };
  }

  registerOutput(
    dto: {
      projectId: string;
      outputType: ResearchOutputRecord["outputType"];
      title: string;
      documentId?: string;
    },
    principal: AuthorizationPrincipal,
  ): ResearchOutputRecord {
    const project = this.requireProject(dto.projectId);
    this.authorization.assertResearchOperation(
      principal,
      project.institutionId,
    );
    if (!dto.title?.trim())
      throw this.validation("Research output title is required");

    const output: ResearchOutputRecord = {
      outputId: randomUUID(),
      projectId: dto.projectId,
      outputType: dto.outputType,
      title: dto.title.trim(),
      status: "Submitted",
      documentId: dto.documentId?.trim() || undefined,
    };
    this.outputs.set(dto.projectId, [
      ...(this.outputs.get(dto.projectId) ?? []),
      output,
    ]);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.output.registered",
      entityType: "ResearchOutput",
      entityId: output.outputId,
      metadata: { sourceId: "FR-027" },
    });
    return { ...output };
  }

  acceptOutput(
    projectId: string,
    outputId: string,
    principal: AuthorizationPrincipal,
  ): ResearchOutputRecord {
    const project = this.requireProject(projectId);
    this.authorization.assertResearchOperation(
      principal,
      project.institutionId,
    );
    const list = [...(this.outputs.get(projectId) ?? [])];
    const index = list.findIndex((output) => output.outputId === outputId);
    if (index < 0) throw this.notFound(`ResearchOutput ${outputId} not found`);
    if (list[index].status !== "Submitted") {
      throw this.validation("Only Submitted research output can be accepted");
    }
    const updated: ResearchOutputRecord = {
      ...list[index],
      status: "Accepted",
      completedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.outputs.set(projectId, list);
    this.audit.append({
      actorUserId: principal.userId,
      action: "research.output.accepted",
      entityType: "ResearchOutput",
      entityId: outputId,
      metadata: { sourceId: "FR-027" },
    });
    return { ...updated };
  }

  getProject(
    projectId: string,
    principal?: AuthorizationPrincipal,
  ): ResearchProjectRecord {
    const project = this.requireProject(projectId);
    if (principal) {
      this.authorization.assertResearchOperation(
        principal,
        project.institutionId,
      );
    }
    return { ...project };
  }

  getProjectAmendments(
    projectId: string,
    principal: AuthorizationPrincipal,
  ): AmendmentRequestRecord[] {
    const project = this.requireProject(projectId);
    this.authorization.assertResearchOperation(
      principal,
      project.institutionId,
    );
    return (this.amendments.get(projectId) ?? []).map((item) => ({ ...item }));
  }

  getProjectOutputs(
    projectId: string,
    principal: AuthorizationPrincipal,
  ): ResearchOutputRecord[] {
    const project = this.requireProject(projectId);
    this.authorization.assertResearchOperation(
      principal,
      project.institutionId,
    );
    return (this.outputs.get(projectId) ?? []).map((item) => ({ ...item }));
  }

  getAllProjects(principal: AuthorizationPrincipal): ResearchProjectRecord[] {
    return Array.from(this.projects.values())
      .filter((project) =>
        this.authorization.canManageInstitution(
          principal,
          project.institutionId,
        ),
      )
      .map((project) => ({ ...project }));
  }

  countProjectsForProposal(proposalId: string): number {
    return Array.from(this.projects.values()).filter(
      (project) => project.proposalId === proposalId,
    ).length;
  }

  private assertProjectCompletable(
    projectId: string,
    project: ResearchProjectRecord,
  ): void {
    this.assertDateRange(project.startDate, project.endDate, true);
    if (!project.leaderId?.trim()) {
      throw this.validation("BR-020: Completed project requires a leader");
    }
    const accepted = (this.outputs.get(projectId) ?? []).some(
      (output) => output.status === "Accepted",
    );
    if (!accepted) {
      throw this.validation(
        "UC-11: Project cannot become Completed without an accepted research output",
      );
    }
  }

  private assertDateRange(
    startDate: string | undefined,
    endDate: string | undefined,
    requireEndDate = false,
  ): void {
    if (!startDate || !Number.isFinite(Date.parse(startDate))) {
      throw this.validation("Project startDate is required and must be valid");
    }
    if (requireEndDate && !endDate) {
      throw this.validation(
        "BR-020: Active/approved project requires a defined period",
      );
    }
    if (endDate) {
      if (!Number.isFinite(Date.parse(endDate))) {
        throw this.validation("Project endDate must be valid");
      }
      if (Date.parse(endDate) < Date.parse(startDate)) {
        throw this.validation("BR-020: endDate must be on or after startDate");
      }
    }
  }

  private requireProject(projectId: string): ResearchProjectRecord {
    const project = this.projects.get(projectId);
    if (!project) throw this.notFound(`Project ${projectId} not found`);
    return project;
  }

  private findAmendment(amendmentId: string): {
    projectId: string;
    index: number;
    record: AmendmentRequestRecord;
  } {
    for (const [projectId, list] of this.amendments.entries()) {
      const index = list.findIndex((item) => item.amendmentId === amendmentId);
      if (index >= 0) return { projectId, index, record: list[index] };
    }
    throw this.notFound(`AmendmentRequest ${amendmentId} not found`);
  }

  private replaceAmendment(
    projectId: string,
    index: number,
    record: AmendmentRequestRecord,
  ): void {
    const list = [...(this.amendments.get(projectId) ?? [])];
    list[index] = record;
    this.amendments.set(projectId, list);
  }

  private validation(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }

  private notFound(message: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message,
    });
  }
}
