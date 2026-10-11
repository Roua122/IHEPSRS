import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { AcademicAuditService } from "./academic-audit.service";
import { AcademicAuthorizationService } from "./academic-authorization.service";
import { AcademicReferenceService } from "./academic-reference.service";
import type {
  DegreeDecisionRecord,
  EnrollmentDecisionHistory,
  EnrollmentRecord,
  EnrollmentStatus,
} from "./academic.types";
import { ApplicantService } from "./applicant.service";
import { ApplicationWorkflowService } from "./application-workflow.service";
import { DegreeReadinessGateway } from "./degree-readiness.gateway";
import { EnrollmentPolicyService } from "./enrollment-policy.service";

export interface CreateEnrollmentInput {
  applicationId: string;
  startDate: string;
  academicYear: string;
}

export interface EnrollmentStatusSnapshot {
  enrollmentId: string;
  asOf: string;
  datasetVersion: string;
  status: EnrollmentStatus;
  history: ReturnType<AcademicAuditService["history"]>;
}

function copyEnrollment(item: EnrollmentRecord): EnrollmentRecord {
  return {
    ...item,
    policyValueSnapshot: { ...item.policyValueSnapshot },
    decisions: item.decisions.map((decision) => ({ ...decision })),
  };
}

/** UTC-safe month arithmetic (e.g., Jan 31 + 1 month = last day of Feb). */
function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return first.toISOString().slice(0, 10);
}

/**
 * TASK-PG-005 — FR-013/045, BR-003/008/009/052/053/054, UC-06/21.
 * Operations are explicit; arbitrary status PATCH is forbidden.
 * IMPORTANT: prototype Map storage / audit is not a durable DB transaction.
 * NFR-014 and multi-instance uniqueness require shared transactional storage.
 */
@Injectable()
export class EnrollmentLifecycleService {
  private readonly enrollments = new Map<string, EnrollmentRecord>();
  private readonly degreeDecisions = new Map<string, DegreeDecisionRecord>();

  constructor(
    private readonly workflows: ApplicationWorkflowService,
    private readonly applicants: ApplicantService,
    private readonly persons: PersonIdentityService,
    private readonly references: AcademicReferenceService,
    private readonly authorization: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
    private readonly policies: EnrollmentPolicyService,
    private readonly degreeReadiness: DegreeReadinessGateway,
  ) {}

  create(
    input: CreateEnrollmentInput,
    principal: AuthorizationPrincipal,
  ): EnrollmentRecord {
    const applicationId = this.required(input?.applicationId, "applicationId");
    const application = this.workflows.getOne(applicationId, principal);
    this.authorization.assertOfficer(
      principal,
      application.institutionId,
      application.programId,
    );
    return this.createFromAcceptedApplication(input, principal);
  }

  private createFromAcceptedApplication(
    input: CreateEnrollmentInput,
    principal: AuthorizationPrincipal,
    prior?: EnrollmentRecord,
    reEnrollmentReason?: string,
  ): EnrollmentRecord {
    const applicationId = this.required(input.applicationId, "applicationId");
    const application = this.workflows.getOne(applicationId, principal);
    this.authorization.assertOfficer(
      principal,
      application.institutionId,
      application.programId,
    );
    const startDate = this.strictDate(input.startDate, "startDate");
    const academicYear = this.academicYear(input.academicYear, startDate);
    // PG004 is the mandatory BR-008 admission boundary. These references all
    // originate from the stored application, NEVER from the caller's body.
    const evidence = this.workflows.admissionEvidenceForEnrollment(
      applicationId,
      {
        personId: application.personId,
        institutionId: application.institutionId,
        programId: application.programId,
        admissionCycleId: application.admissionCycleId,
        startDate,
      },
      principal,
    );
    const student = this.applicants.getStudentForPerson(
      evidence.personId,
      evidence.institutionId,
    );
    if (
      !student ||
      this.persons.resolveCanonicalPersonId(student.personId) !==
        evidence.personId ||
      (application.studentId && application.studentId !== student.studentId)
    ) {
      throw this.conflict(
        "FR-013/BR-004/055: matching trusted SIS Student mapping is required",
      );
    }
    if (prior) {
      if (
        prior.status !== "Withdrawn" ||
        this.persons.resolveCanonicalPersonId(prior.personId) !==
          evidence.personId ||
        prior.institutionId !== evidence.institutionId ||
        prior.programId !== evidence.programId
      ) {
        throw this.conflict(
          "BR-053: re-enrollment must follow a withdrawn enrollment in the same program",
        );
      }
    } else if (
      [...this.enrollments.values()].some(
        (record) => record.applicationId === applicationId,
      )
    ) {
      // Same accepted decision cannot silently yield two unrelated enrollments.
      throw this.conflict(
        "FR-013: this admission application already has an enrollment",
      );
    }
    this.assertNoConcurrentLiveEnrollment(
      evidence.personId,
      evidence.institutionId,
      evidence.programId,
    );
    // FR-043/BR-062: current APPROVED policy at operation time, not an
    // arbitrary browser policyVersionId or an unapproved future draft.
    const policy = this.policies.applicable(
      evidence.programId,
      evidence.admissionCycleId,
    );
    const now = new Date().toISOString();
    const record: EnrollmentRecord = {
      enrollmentId: randomUUID(),
      studentId: student.studentId,
      personId: evidence.personId,
      institutionId: evidence.institutionId,
      programId: evidence.programId,
      applicationId,
      admissionCycleId: evidence.admissionCycleId,
      admissionDecisionId: evidence.decisionId,
      admissionPolicyVersionId: evidence.policyVersionId,
      submissionSnapshotId: evidence.submissionSnapshotId,
      submittedProgramVersionNo: evidence.submittedProgramVersionNo,
      startDate,
      academicYear,
      policyVersionId: policy.policyId,
      policyId: policy.policyId,
      policyValueSnapshot: { ...policy.value },
      status: evidence.initialEnrollmentStatusIfOtherChecksPass,
      createdAt: now,
      plannedStudyEndDate: addMonths(startDate, policy.value.normalStudyMonths),
      pendingValidationReason: evidence.pendingValidationReason,
      priorEnrollmentId: prior?.enrollmentId,
      decisions: [],
    };
    if (prior) {
      record.decisions.push(
        this.decision(
          principal,
          "ReEnroll",
          reEnrollmentReason!,
          record.policyVersionId,
          prior.enrollmentId,
        ),
      );
    }
    this.audit.transition({
      entityType: "Enrollment",
      entityId: record.enrollmentId,
      toStatus: record.status,
      actorUserId: principal.userId,
      sourceId: "FR-013/BR-003/BR-008/BR-009/BR-053",
      reasonCode:
        record.pendingValidationReason ??
        (prior ? "ReEnroll" : "AcceptedAdmission"),
    });
    this.enrollments.set(record.enrollmentId, record);
    return copyEnrollment(record);
  }

  /** BR-008: a fresh PGA decision is required to resolve inactive program. */
  resolvePending(
    id: string,
    input: { reason: string; approvedProgramReference: string },
    principal: AuthorizationPrincipal,
  ): EnrollmentRecord {
    const current = this.requireScoped(id, principal, true);
    if (
      current.status !== "PendingValidation" ||
      current.pendingValidationReason !== "PROGRAM_NOT_EFFECTIVE_AT_START_DATE"
    ) {
      throw this.conflict(
        "BR-008: enrollment is not pending program validation",
      );
    }
    const reason = this.required(input?.reason, "reason");
    const reference = this.required(
      input?.approvedProgramReference,
      "approvedProgramReference",
    );
    // The registry must now recognize a valid version at the original start.
    // PG004's accepted person/program/cycle binding is never changed here.
    const program = this.references.assertProgramEffective(
      current.programId,
      current.startDate,
    );
    if (
      program.institutionId !== current.institutionId ||
      program.versionNo <= current.submittedProgramVersionNo
    ) {
      throw this.conflict(
        "BR-008: a newly approved effective program version is required",
      );
    }
    this.assertNoConcurrentLiveEnrollment(
      current.personId,
      current.institutionId,
      current.programId,
      current.enrollmentId,
    );
    const next = copyEnrollment(current);
    next.status = "Active";
    next.pendingValidationReason = undefined;
    next.decisions.push(
      this.decision(
        principal,
        "Activate",
        reason,
        current.policyVersionId,
        reference,
      ),
    );
    this.saveTransition(
      current,
      next,
      principal,
      "BR-008/FR-045",
      "ProgramValidationApproved",
    );
    return copyEnrollment(next);
  }

  suspend(
    id: string,
    input: { reason: string },
    principal: AuthorizationPrincipal,
  ) {
    return this.changeState(
      id,
      input,
      principal,
      "Active",
      "Suspended",
      "Suspend",
      true,
    );
  }

  resume(
    id: string,
    input: { reason: string },
    principal: AuthorizationPrincipal,
  ) {
    const current = this.requireScoped(id, principal, true);
    if (current.status !== "Suspended")
      throw this.conflict("BR-053: only Suspended may resume");
    if (this.today() > current.plannedStudyEndDate) {
      throw this.conflict(
        "BR-052: study period expired; extension or approved Exception required",
      );
    }
    this.references.assertProgramEffective(current.programId, this.today());
    this.assertNoConcurrentLiveEnrollment(
      current.personId,
      current.institutionId,
      current.programId,
      current.enrollmentId,
    );
    return this.changeState(
      id,
      input,
      principal,
      "Suspended",
      "Active",
      "Resume",
      true,
    );
  }

  withdraw(
    id: string,
    input: { reason: string },
    principal: AuthorizationPrincipal,
  ) {
    return this.changeState(
      id,
      input,
      principal,
      ["Active", "Suspended", "PendingValidation"],
      "Withdrawn",
      "Withdraw",
      true,
    );
  }

  cancel(
    id: string,
    input: { reason: string },
    principal: AuthorizationPrincipal,
  ) {
    return this.changeState(
      id,
      input,
      principal,
      ["Active", "Suspended", "PendingValidation"],
      "Cancelled",
      "Cancel",
      true,
    );
  }

  /** BR-053: independent re-enrollment record; original remains Withdrawn. */
  reEnroll(
    previousId: string,
    input: CreateEnrollmentInput & { reason: string },
    principal: AuthorizationPrincipal,
  ): EnrollmentRecord {
    const prior = this.requireScoped(previousId, principal, true);
    const reason = this.required(input?.reason, "reason");
    if (prior.status !== "Withdrawn")
      throw this.conflict("BR-053: prior enrollment must be Withdrawn");
    if (input.applicationId !== prior.applicationId) {
      // Moving to a different application must first pass its own verified
      // admissions/transfer workflow; not guessed from client input.
      throw this.conflict(
        "BR-053: separate admission transfer workflow is required",
      );
    }
    return this.createFromAcceptedApplication(input, principal, prior, reason);
  }

  /** BR-052: count, per-extension duration, and absolute duration are pinned. */
  extend(
    id: string,
    input: { months: number; reason: string },
    principal: AuthorizationPrincipal,
  ): EnrollmentRecord {
    const current = this.requireScoped(id, principal, true);
    if (!["Active", "Suspended"].includes(current.status)) {
      throw this.conflict("BR-052: extension requires a live enrollment");
    }
    const reason = this.required(input?.reason, "reason");
    const months = this.months(input?.months);
    const limits = current.policyValueSnapshot;
    const extensions = current.decisions.filter(
      (item) => item.operation === "Extend",
    );
    if (
      extensions.length >= limits.maxExtensions ||
      months > limits.maxExtensionMonths
    ) {
      throw this.conflict(
        "BR-052: extension count or individual extension limit exceeded",
      );
    }
    const end = addMonths(current.plannedStudyEndDate, months);
    if (end > addMonths(current.startDate, limits.maxStudyMonths)) {
      throw this.conflict(
        "BR-052: maximum approved study duration exceeded; recorded Exception required",
      );
    }
    const next = copyEnrollment(current);
    next.plannedStudyEndDate = end;
    next.decisions.push(
      this.decision(
        principal,
        "Extend",
        reason,
        current.policyVersionId,
        undefined,
        months,
      ),
    );
    this.audit.record(
      principal.userId,
      "postgraduate.enrollment.extended",
      "Enrollment",
      id,
      "BR-052",
    );
    this.enrollments.set(id, next);
    return copyEnrollment(next);
  }

  /** Only PGA may override BR-052 in an independently auditable exception. */
  approveDurationException(
    id: string,
    input: { months: number; reason: string; evidenceReference: string },
    principal: AuthorizationPrincipal,
  ): EnrollmentRecord {
    const current = this.requireScoped(id, principal, true);
    if (!["Active", "Suspended"].includes(current.status)) {
      throw this.conflict("BR-052: exception requires live enrollment");
    }
    const reason = this.required(input?.reason, "reason");
    const evidence = this.required(
      input?.evidenceReference,
      "evidenceReference",
    );
    const months = this.months(input?.months);
    const next = copyEnrollment(current);
    next.plannedStudyEndDate = addMonths(next.plannedStudyEndDate, months);
    next.decisions.push(
      this.decision(
        principal,
        "Exception",
        reason,
        current.policyVersionId,
        evidence,
        months,
      ),
    );
    this.audit.record(
      principal.userId,
      "postgraduate.enrollment.exception.approved",
      "Enrollment",
      id,
      "BR-052",
    );
    this.enrollments.set(id, next);
    return copyEnrollment(next);
  }

  /** BR-054: DegreeDecision is separate and only trusted evidence may clear it. */
  async approveDegree(
    id: string,
    input: { reason: string },
    principal: AuthorizationPrincipal,
  ): Promise<EnrollmentRecord> {
    const current = this.requireScoped(id, principal, true);
    const reason = this.required(input?.reason, "reason");
    if (current.status !== "Active" || this.degreeDecisions.has(id)) {
      throw this.conflict(
        "BR-054: degree requires an eligible, not previously completed, active enrollment",
      );
    }
    const program = this.references.getProgram(current.programId);
    if (this.today() > current.plannedStudyEndDate) {
      throw this.conflict("BR-052/BR-054: approved study period expired");
    }
    const evidence = await this.degreeReadiness.assess({
      enrollmentId: current.enrollmentId,
      studentId: current.studentId,
      personId: current.personId,
      institutionId: current.institutionId,
      programId: current.programId,
      thesisRequired: program.thesisRequired,
    });
    if (
      !evidence.programRequirementsComplete ||
      !evidence.noMandatoryHolds ||
      (program.thesisRequired && !evidence.thesisApproved) ||
      !evidence.evidenceRefs.length ||
      evidence.evidenceRefs.some((ref) => !ref.trim())
    ) {
      throw this.conflict(
        "BR-054: program/thesis/Holds evidence is incomplete",
      );
    }
    // Trusted readiness checks are async: another authority could have
    // completed/cancelled the enrollment while this call was pending.
    if (this.enrollments.get(id) !== current || this.degreeDecisions.has(id)) {
      throw this.conflict(
        "NFR-014/BR-054: enrollment changed during degree verification; retry",
      );
    }
    const now = new Date().toISOString();
    const decision: DegreeDecisionRecord = {
      degreeDecisionId: randomUUID(),
      enrollmentId: id,
      approvedByUserId: principal.userId,
      approvedAt: now,
      sourceEvidenceRefs: [...evidence.evidenceRefs],
      policyVersionId: current.policyVersionId,
    };
    const next = copyEnrollment(current);
    next.status = "Completed";
    next.completionDate = now.slice(0, 10);
    next.decisions.push(
      this.decision(
        principal,
        "DegreeApproved",
        reason,
        current.policyVersionId,
        decision.degreeDecisionId,
      ),
    );
    this.saveTransition(
      current,
      next,
      principal,
      "BR-054/FR-045",
      "DegreeDecisionApproved",
    );
    this.degreeDecisions.set(id, decision);
    return copyEnrollment(next);
  }

  getDegreeDecision(
    id: string,
    principal: AuthorizationPrincipal,
  ): DegreeDecisionRecord {
    this.requireScoped(id, principal);
    const record = this.degreeDecisions.get(id);
    if (!record) throw this.notFound("BR-054: degree decision not found");
    return { ...record, sourceEvidenceRefs: [...record.sourceEvidenceRefs] };
  }

  getOne(id: string, principal: AuthorizationPrincipal): EnrollmentRecord {
    return copyEnrollment(this.requireScoped(id, principal));
  }

  listForOfficer(
    institutionId: string,
    programId: string,
    principal: AuthorizationPrincipal,
  ) {
    this.authorization.assertOfficer(principal, institutionId, programId);
    return [...this.enrollments.values()]
      .filter(
        (item) =>
          item.institutionId === institutionId && item.programId === programId,
      )
      .map(copyEnrollment);
  }

  /** FR-045: one asOf timestamp for history/status, not a full report warehouse. */
  statusAsOf(
    id: string,
    asOf: string,
    principal: AuthorizationPrincipal,
  ): EnrollmentStatusSnapshot {
    const current = this.requireScoped(id, principal);
    const timestamp = this.utcTimestamp(asOf);
    if (timestamp < current.createdAt)
      throw this.notFound("FR-045: no enrollment existed at asOf");
    const events = this.audit
      .history("Enrollment", current.enrollmentId)
      .filter((item) => item.changedAt <= timestamp);
    if (!events.length)
      throw this.notFound("FR-045: no enrollment state existed at asOf");
    const last = events.at(-1)!;
    return {
      enrollmentId: id,
      asOf: timestamp,
      datasetVersion: `${id}:${events.length}:${last.statusHistoryId}`,
      status: last.toStatus as EnrollmentStatus,
      history: events,
    };
  }

  private changeState(
    id: string,
    input: { reason: string },
    principal: AuthorizationPrincipal,
    from: EnrollmentStatus | EnrollmentStatus[],
    to: EnrollmentStatus,
    operation: EnrollmentDecisionHistory["operation"],
    asAuthority: boolean,
  ): EnrollmentRecord {
    const current = this.requireScoped(id, principal, asAuthority);
    const reason = this.required(input?.reason, "reason");
    if (
      !(Array.isArray(from)
        ? from.includes(current.status)
        : current.status === from)
    ) {
      throw this.conflict(
        `BR-053: ${operation} is not allowed from ${current.status}`,
      );
    }
    const next = copyEnrollment(current);
    next.status = to;
    next.decisions.push(
      this.decision(principal, operation, reason, current.policyVersionId),
    );
    this.saveTransition(current, next, principal, "BR-053/FR-045", operation);
    return copyEnrollment(next);
  }

  private decision(
    principal: AuthorizationPrincipal,
    operation: EnrollmentDecisionHistory["operation"],
    reason: string,
    version: string,
    referenceId?: string,
    months?: number,
  ): EnrollmentDecisionHistory {
    return {
      decisionId: randomUUID(),
      decidedAt: new Date().toISOString(),
      decidedByUserId: principal.userId,
      operation,
      reason,
      policyVersionId: version,
      referenceId,
      months,
    };
  }

  private saveTransition(
    current: EnrollmentRecord,
    next: EnrollmentRecord,
    principal: AuthorizationPrincipal,
    sourceId: string,
    reasonCode: string,
  ): void {
    this.audit.transition({
      entityType: "Enrollment",
      entityId: current.enrollmentId,
      fromStatus: current.status,
      toStatus: next.status,
      actorUserId: principal.userId,
      sourceId,
      reasonCode,
    });
    this.enrollments.set(current.enrollmentId, next);
  }

  private assertNoConcurrentLiveEnrollment(
    personId: string,
    institutionId: string,
    programId: string,
    excludeId?: string,
  ): void {
    const duplicate = [...this.enrollments.values()].some(
      (enrollment) =>
        enrollment.enrollmentId !== excludeId &&
        this.persons.resolveCanonicalPersonId(enrollment.personId) ===
          this.persons.resolveCanonicalPersonId(personId) &&
        enrollment.institutionId === institutionId &&
        enrollment.programId === programId &&
        ["Active", "Suspended", "PendingValidation"].includes(
          enrollment.status,
        ),
    );
    if (duplicate) {
      // BR-009: a documented exemption is NOT a client boolean. Exception
      // approval/unique constraint must be added with persistent registry.
      throw this.conflict(
        "BR-009: another current enrollment exists for this person/program/institution",
      );
    }
  }

  private requireScoped(
    id: string,
    principal: AuthorizationPrincipal,
    authority = false,
  ): EnrollmentRecord {
    const current = this.enrollments.get(id);
    if (!current) throw this.notFound("FR-013: enrollment not found");
    if (authority) {
      this.authorization.assertAuthority(
        principal,
        current.institutionId,
        current.programId,
      );
    } else if (
      !(
        principal?.authenticated &&
        principal.personId &&
        this.persons.resolveCanonicalPersonId(principal.personId) ===
          this.persons.resolveCanonicalPersonId(current.personId)
      ) &&
      !this.authorization.canRead(
        principal,
        current.personId,
        current.institutionId,
        current.programId,
      )
    ) {
      throw new AppException({
        code: ErrorCode.Forbidden,
        status: HttpStatus.FORBIDDEN,
        message: "FR-013: enrollment access denied",
      });
    }
    return current;
  }

  private months(value: number): number {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1200) {
      throw this.invalid("BR-052: months must be a positive integer");
    }
    return value;
  }
  private required(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim())
      throw this.invalid(`FR-013: ${field} is required`);
    return value.trim();
  }
  private strictDate(value: unknown, field: string): string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) ||
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
    ) {
      throw this.invalid(
        `FR-013/NFR-021: invalid ${field}, expected YYYY-MM-DD`,
      );
    }
    return value;
  }
  private academicYear(value: unknown, startDate: string): string {
    if (typeof value !== "string" || !/^\d{4}\/\d{4}$/.test(value)) {
      throw this.invalid("FR-013: academicYear must have YYYY/YYYY format");
    }
    const [from, to] = value.split("/").map(Number);
    const year = Number(startDate.slice(0, 4));
    if (to !== from + 1 || (year !== from && year !== to)) {
      throw this.invalid(
        "FR-013: academicYear must be consecutive and include the start year",
      );
    }
    return value;
  }
  private utcTimestamp(value: string): string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString() !== value
    ) {
      throw this.invalid(
        "FR-045/NFR-021: asOf must be an ISO-8601 UTC timestamp",
      );
    }
    return value;
  }
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
  private invalid(message: string): AppException {
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
