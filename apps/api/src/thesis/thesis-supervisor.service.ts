import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  SupervisorEligibilityResult,
  ThesisSupervisorAssignmentRecord,
  ThesisSupervisorRole,
} from "@ihepsrs/contracts";

import { PrototypeAuditService } from "../common/audit/prototype-audit.service";
import { AppException } from "../common/errors/app-exception";
import { ErrorCode } from "../common/errors/error-code";
import type { AuthorizationPrincipal } from "../identity/authorization/authorization.types";
import { InstitutionsService } from "../institutions/institutions.service";
import { PersonIdentityService } from "../research/domain/person-identity.service";
import type {
  AssignSupervisorDto,
  CheckSupervisorEligibilityDto,
  EndSupervisorAssignmentDto,
} from "./assign-supervisor.dto";
import { ThesisAuthorizationService } from "./thesis-authorization.service";
import { ThesisSupervisionContextService } from "./thesis-supervision-context.service";

export const THESIS_SUPERVISORY_LOAD_POLICY_KEY =
  "THESIS_SUPERVISORY_LOAD_LIMIT";
export const THESIS_SUPERVISORY_LOAD_CENTRAL_SCOPE_ID = "GLOBAL";
export const DEFAULT_SUPERVISORY_LOAD_LIMIT_POINTS = 5;

interface SupervisoryLoadPolicyValue {
  defaultLimitPoints?: number;
  rankLimits?: Record<string, number>;
}

interface AssignmentPolicySnapshot {
  assignmentId: string;
  evaluatedAt: string;
  loadWeightPoints: number;
  loadLimitPoints: number;
  roleRank?: string;
  policyId?: string;
  policyVersionNo?: number;
}

interface LoadPolicyResolution {
  limitPoints: number;
  roleRank?: string;
  policyId?: string;
  policyVersionNo?: number;
}

@Injectable()
export class ThesisSupervisorService {
  private readonly assignments = new Map<
    string,
    ThesisSupervisorAssignmentRecord
  >();
  private readonly policySnapshots = new Map<
    string,
    AssignmentPolicySnapshot
  >();

  constructor(
    private readonly contexts: ThesisSupervisionContextService,
    private readonly people: PersonIdentityService,
    private readonly institutions: InstitutionsService,
    private readonly authorization: ThesisAuthorizationService,
    private readonly audit: PrototypeAuditService,
  ) {}

  listAssignments(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisSupervisorAssignmentRecord[] {
    const context = this.contexts.get(thesisId);
    this.authorization.assertView(principal, context.institutionId);
    return this.assignmentsForThesis(thesisId).map((record) => ({ ...record }));
  }

  checkEligibility(
    thesisId: string,
    dto: CheckSupervisorEligibilityDto,
    principal: AuthorizationPrincipal,
  ): SupervisorEligibilityResult {
    const context = this.contexts.get(thesisId);
    this.authorization.assertView(principal, context.institutionId);
    return this.evaluateEligibility(
      thesisId,
      dto.researcherId,
      dto.role,
      dto.startDate,
    );
  }

  assignSupervisor(
    thesisId: string,
    dto: AssignSupervisorDto,
    principal: AuthorizationPrincipal,
  ): ThesisSupervisorAssignmentRecord {
    const context = this.contexts.get(thesisId);
    this.authorization.assertApprove(principal, context.institutionId);
    this.assertApprovalActor(dto.approvedByUserId, principal);
    const startDate = this.dateOnly(dto.startDate);

    return this.transact(() => {
      const eligibility = this.evaluateEligibility(
        thesisId,
        dto.researcherId,
        dto.role,
        startDate,
      );
      if (!eligibility.eligible) {
        throw this.validation(
          `FR-014/BR-043/BR-044: Supervisor is not eligible: ${eligibility.reasons.join(
            "; ",
          )}`,
        );
      }

      if (dto.role === "MAIN") {
        this.prepareMainAssignmentChange(
          thesisId,
          startDate,
          dto.changeReason,
          dto.approvedByUserId,
          dto.approvalDecisionId,
          principal,
        );
      }

      const assignment: ThesisSupervisorAssignmentRecord = {
        assignmentId: randomUUID(),
        thesisId,
        researcherId: dto.researcherId.trim(),
        role: dto.role,
        startDate,
        status: "Active",
        approvedByUserId: principal.userId,
        changeReason: dto.changeReason?.trim() || undefined,
        approvalDecisionId: dto.approvalDecisionId?.trim() || undefined,
      };
      this.assignments.set(assignment.assignmentId, assignment);
      this.policySnapshots.set(assignment.assignmentId, {
        assignmentId: assignment.assignmentId,
        evaluatedAt: startDate,
        loadWeightPoints: this.roleWeight(dto.role),
        loadLimitPoints: eligibility.limitPoints,
        roleRank: eligibility.roleRank,
        policyId: eligibility.policyId,
        policyVersionNo: eligibility.policyVersionNo,
      });
      this.audit.append({
        actorUserId: principal.userId,
        action: "thesis.supervisor.assigned",
        entityType: "ThesisSupervisorAssignment",
        entityId: assignment.assignmentId,
        metadata: {
          sourceId: "FR-014/BR-012/BR-043/BR-044/UC-06/NFR-014",
          thesisId,
          researcherId: assignment.researcherId,
          role: assignment.role,
          loadWeightPoints: this.roleWeight(assignment.role),
          loadLimitPoints: eligibility.limitPoints,
          policyVersionNo: eligibility.policyVersionNo ?? null,
        },
      });
      return { ...assignment };
    });
  }

  endAssignment(
    thesisId: string,
    assignmentId: string,
    dto: EndSupervisorAssignmentDto,
    principal: AuthorizationPrincipal,
  ): ThesisSupervisorAssignmentRecord {
    const context = this.contexts.get(thesisId);
    this.authorization.assertApprove(principal, context.institutionId);
    this.assertApprovalActor(dto.approvedByUserId, principal);

    return this.transact(() => {
      const assignment = this.requireAssignment(assignmentId);
      if (assignment.thesisId !== thesisId) {
        throw this.notFound("Supervisor assignment not found for Thesis");
      }
      if (assignment.status === "Ended") {
        throw this.conflict("Supervisor assignment is already ended");
      }
      const endDate = this.dateOnly(dto.endDate);
      if (this.time(endDate) < this.time(assignment.startDate)) {
        throw this.validation("BR-043: endDate must be >= startDate");
      }

      assignment.endDate = endDate;
      assignment.status = "Ended";
      assignment.changeReason = dto.changeReason.trim();
      assignment.approvedByUserId = principal.userId;
      assignment.approvalDecisionId =
        dto.approvalDecisionId?.trim() || assignment.approvalDecisionId;
      this.audit.append({
        actorUserId: principal.userId,
        action: "thesis.supervisor.ended",
        entityType: "ThesisSupervisorAssignment",
        entityId: assignment.assignmentId,
        metadata: {
          sourceId: "BR-012/BR-043/UC-06/NFR-014",
          thesisId,
          researcherId: assignment.researcherId,
          role: assignment.role,
        },
      });
      return { ...assignment };
    });
  }

  getSupervisionReadiness(
    thesisId: string,
    principal: AuthorizationPrincipal,
    asOf = new Date().toISOString().slice(0, 10),
  ): {
    thesisId: string;
    asOf: string;
    canEnterInProgress: boolean;
    activeMainAssignmentId?: string;
  } {
    const context = this.contexts.get(thesisId);
    this.authorization.assertView(principal, context.institutionId);
    const readiness = this.supervisionReadiness(thesisId, asOf);
    return { thesisId, asOf: this.dateOnly(asOf), ...readiness };
  }

  /**
   * Integration hook for TH-001/TH-003 state transitions.
   * The Thesis state owner must call this before ProposalApproved -> InProgress.
   */
  assertReadyForInProgress(
    thesisId: string,
    asOf = new Date().toISOString().slice(0, 10),
  ): void {
    const readiness = this.supervisionReadiness(thesisId, asOf);
    if (!readiness.canEnterInProgress) {
      throw this.conflict(
        "BR-011: Thesis cannot enter InProgress without one approved active MAIN supervisor",
      );
    }
  }

  getPolicySnapshot(
    assignmentId: string,
  ): AssignmentPolicySnapshot | undefined {
    const snapshot = this.policySnapshots.get(assignmentId);
    return snapshot ? { ...snapshot } : undefined;
  }

  verifyAuditChain(): boolean {
    return this.audit.verifyChain();
  }

  private evaluateEligibility(
    thesisId: string,
    researcherId: string,
    role: ThesisSupervisorRole,
    startDateInput: string,
  ): SupervisorEligibilityResult {
    const context = this.contexts.get(thesisId);
    const startDate = this.dateOnly(startDateInput);
    const reasons: string[] = [];
    const researcher = this.people.getResearcher(researcherId);
    if (researcher.status !== "Active") {
      reasons.push("Researcher profile is not Active");
    }
    if (researcher.personId === context.studentPersonId) {
      reasons.push("BR-043: Supervisor cannot be the Thesis student Person");
    }

    const policy = this.resolveLoadPolicy(
      context.programId,
      context.institutionId,
      researcherId,
      startDate,
    );
    const currentLoadPoints = this.currentLoadPoints(researcherId, startDate);
    const proposedLoadPoints = this.roleWeight(role);
    if (currentLoadPoints + proposedLoadPoints > policy.limitPoints) {
      reasons.push(
        `BR-044: Supervisory load ${currentLoadPoints + proposedLoadPoints} exceeds limit ${policy.limitPoints}`,
      );
    }

    if (role === "MAIN") {
      const futureOverlap = this.mainAssignments(thesisId).some(
        (assignment) =>
          this.time(assignment.startDate) > this.time(startDate) &&
          this.intervalOverlaps(
            startDate,
            undefined,
            assignment.startDate,
            assignment.endDate,
          ),
      );
      if (futureOverlap) {
        reasons.push(
          "BR-043: New MAIN assignment would overlap a future MAIN assignment",
        );
      }
    }

    return {
      thesisId,
      researcherId,
      role,
      evaluatedAt: startDate,
      eligible: reasons.length === 0,
      reasons,
      currentLoadPoints,
      proposedLoadPoints,
      limitPoints: policy.limitPoints,
      roleRank: policy.roleRank,
      policyId: policy.policyId,
      policyVersionNo: policy.policyVersionNo,
    };
  }

  private prepareMainAssignmentChange(
    thesisId: string,
    startDate: string,
    changeReason: string | undefined,
    approvedByUserId: string,
    approvalDecisionId: string | undefined,
    principal: AuthorizationPrincipal,
  ): void {
    const overlapping = this.mainAssignments(thesisId).filter((assignment) =>
      this.intervalOverlaps(
        startDate,
        undefined,
        assignment.startDate,
        assignment.endDate,
      ),
    );
    const current = overlapping.filter(
      (assignment) => this.time(assignment.startDate) <= this.time(startDate),
    );
    const future = overlapping.filter(
      (assignment) => this.time(assignment.startDate) > this.time(startDate),
    );

    if (future.length > 0) {
      throw this.conflict(
        "BR-043: MAIN supervisor periods cannot overlap a future assignment",
      );
    }
    if (current.length > 1) {
      throw this.conflict(
        "BR-043: Existing MAIN supervisor history is inconsistent",
      );
    }
    if (current.length === 0) return;

    if (!changeReason?.trim()) {
      throw this.validation(
        "BR-043: MAIN supervisor change requires changeReason",
      );
    }
    if (!approvedByUserId.trim()) {
      throw this.validation(
        "BR-043: MAIN supervisor change requires approvedByUserId",
      );
    }

    const previous = current[0];
    previous.endDate = startDate;
    previous.status = "Ended";
    this.audit.append({
      actorUserId: principal.userId,
      action: "thesis.main_supervisor.closed_for_change",
      entityType: "ThesisSupervisorAssignment",
      entityId: previous.assignmentId,
      metadata: {
        sourceId: "BR-012/BR-043/UC-06",
        thesisId,
        researcherId: previous.researcherId,
        approvalDecisionId: approvalDecisionId?.trim() || null,
      },
    });
  }

  private supervisionReadiness(
    thesisId: string,
    asOfInput: string,
  ): { canEnterInProgress: boolean; activeMainAssignmentId?: string } {
    this.contexts.get(thesisId);
    const asOf = this.dateOnly(asOfInput);
    const activeMain = this.mainAssignments(thesisId).filter((assignment) =>
      this.assignmentActiveAt(assignment, asOf),
    );
    return {
      canEnterInProgress: activeMain.length === 1,
      activeMainAssignmentId:
        activeMain.length === 1 ? activeMain[0].assignmentId : undefined,
    };
  }

  private resolveLoadPolicy(
    programId: string,
    institutionId: string,
    researcherId: string,
    at: string,
  ): LoadPolicyResolution {
    const roleRank = this.resolveRoleRank(researcherId, institutionId, at);
    const programPolicy = this.institutions.resolvePolicyAt(
      THESIS_SUPERVISORY_LOAD_POLICY_KEY,
      "Program",
      programId,
      at,
    );
    const centralPolicy = this.institutions.resolvePolicyAt(
      THESIS_SUPERVISORY_LOAD_POLICY_KEY,
      "Central",
      THESIS_SUPERVISORY_LOAD_CENTRAL_SCOPE_ID,
      at,
    );
    const policy = programPolicy ?? centralPolicy;
    const limitPoints = policy
      ? this.limitFromValue(policy.value, roleRank)
      : DEFAULT_SUPERVISORY_LOAD_LIMIT_POINTS;

    return {
      limitPoints,
      roleRank,
      policyId: policy?.policyId,
      policyVersionNo: policy?.versionNo,
    };
  }

  private limitFromValue(value: unknown, roleRank?: string): number {
    if (typeof value === "number") return this.assertValidLimit(value);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw this.validation(
        "BR-044: Supervisory load PolicyConfiguration value is invalid",
      );
    }
    const typed = value as SupervisoryLoadPolicyValue;
    if (roleRank && typed.rankLimits) {
      const rankMatch = Object.entries(typed.rankLimits).find(
        ([rank]) => rank.toLowerCase() === roleRank.toLowerCase(),
      );
      if (rankMatch) return this.assertValidLimit(rankMatch[1]);
    }
    if (typed.defaultLimitPoints !== undefined) {
      return this.assertValidLimit(typed.defaultLimitPoints);
    }
    throw this.validation(
      "BR-044: PolicyConfiguration requires defaultLimitPoints or matching rankLimits",
    );
  }

  private assertValidLimit(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw this.validation(
        "BR-044: Supervisory load limit must be a positive number",
      );
    }
    return value;
  }

  private resolveRoleRank(
    researcherId: string,
    institutionId: string,
    at: string,
  ): string | undefined {
    const eventTime = this.time(at);
    const effective = this.people
      .listResearcherAffiliations(researcherId)
      .filter((record) => {
        const from = this.time(record.effectiveFrom);
        const to = record.effectiveTo ? this.time(record.effectiveTo) : null;
        return eventTime >= from && (to === null || eventTime < to);
      });
    const preferred =
      effective.find((record) => record.institutionId === institutionId) ??
      effective[0];
    return preferred?.roleRank?.trim() || undefined;
  }

  private currentLoadPoints(researcherId: string, at: string): number {
    return [...this.assignments.values()]
      .filter(
        (assignment) =>
          assignment.researcherId === researcherId &&
          this.assignmentActiveAt(assignment, at),
      )
      .reduce((sum, assignment) => sum + this.roleWeight(assignment.role), 0);
  }

  private roleWeight(role: ThesisSupervisorRole): number {
    return role === "MAIN" ? 1 : 0.5;
  }

  private assignmentActiveAt(
    assignment: ThesisSupervisorAssignmentRecord,
    at: string,
  ): boolean {
    const time = this.time(at);
    return (
      time >= this.time(assignment.startDate) &&
      (!assignment.endDate || time < this.time(assignment.endDate))
    );
  }

  private intervalOverlaps(
    leftStart: string,
    leftEnd: string | undefined,
    rightStart: string,
    rightEnd: string | undefined,
  ): boolean {
    const leftStartTime = this.time(leftStart);
    const rightStartTime = this.time(rightStart);
    const leftEndTime = leftEnd ? this.time(leftEnd) : Number.POSITIVE_INFINITY;
    const rightEndTime = rightEnd
      ? this.time(rightEnd)
      : Number.POSITIVE_INFINITY;
    return leftStartTime < rightEndTime && rightStartTime < leftEndTime;
  }

  private mainAssignments(
    thesisId: string,
  ): ThesisSupervisorAssignmentRecord[] {
    return this.assignmentsForThesis(thesisId).filter(
      (assignment) => assignment.role === "MAIN",
    );
  }

  private assignmentsForThesis(
    thesisId: string,
  ): ThesisSupervisorAssignmentRecord[] {
    return [...this.assignments.values()]
      .filter((assignment) => assignment.thesisId === thesisId)
      .sort((a, b) => this.time(a.startDate) - this.time(b.startDate));
  }

  private requireAssignment(
    assignmentId: string,
  ): ThesisSupervisorAssignmentRecord {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) throw this.notFound("Supervisor assignment not found");
    return assignment;
  }

  private assertApprovalActor(
    approvedByUserId: string,
    principal: AuthorizationPrincipal,
  ): void {
    if (approvedByUserId.trim() !== principal.userId) {
      throw this.validation(
        "approvedByUserId must match the authenticated approving actor",
      );
    }
  }

  private transact<T>(operation: () => T): T {
    const assignmentSnapshot = structuredClone(this.assignments);
    const policySnapshot = structuredClone(this.policySnapshots);
    const auditLength = this.audit.snapshotLength();
    try {
      return operation();
    } catch (error) {
      this.restoreMap(this.assignments, assignmentSnapshot);
      this.restoreMap(this.policySnapshots, policySnapshot);
      this.audit.rollbackTo(auditLength);
      throw error;
    }
  }

  private restoreMap<K, V>(target: Map<K, V>, snapshot: Map<K, V>): void {
    target.clear();
    for (const [key, value] of snapshot.entries()) target.set(key, value);
  }

  private dateOnly(value: string): string {
    const timestamp = this.time(value);
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  private time(value: string): number {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      throw this.validation("Invalid date/time");
    }
    return timestamp;
  }

  private validation(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }

  private conflict(message: string): AppException {
    return new AppException({
      code: ErrorCode.Conflict,
      status: HttpStatus.CONFLICT,
      message,
    });
  }

  private notFound(message: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message,
    });
  }
}
