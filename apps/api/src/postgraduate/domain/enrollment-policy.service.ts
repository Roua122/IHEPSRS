import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { AcademicAuditService } from "./academic-audit.service";
import { AcademicAuthorizationService } from "./academic-authorization.service";
import { AcademicReferenceService } from "./academic-reference.service";
import type {
  EnrollmentPolicyConfiguration,
  EnrollmentStudyLimits,
} from "./academic.types";

export interface ApproveEnrollmentPolicyInput {
  programId: string;
  scopeType: "Program" | "Cohort";
  scopeId: string;
  versionNo: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  value: EnrollmentStudyLimits;
}

/**
 * TASK-PG-005 — FR-043/BR-052/BR-062.
 * A SCOPED, effective-dated policy prototype; NOT the national policy owner.
 * An approved version is pinned onto each Enrollment. Database-backed
 * PolicyConfiguration approval/retirement must replace this local map before
 * multi-instance deployment. No implicit/unpublished duration defaults.
 */
@Injectable()
export class EnrollmentPolicyService {
  private readonly approved = new Map<
    string,
    EnrollmentPolicyConfiguration[]
  >();

  constructor(
    private readonly references: AcademicReferenceService,
    private readonly authorization: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
  ) {}

  approve(
    input: ApproveEnrollmentPolicyInput,
    principal: AuthorizationPrincipal,
  ): EnrollmentPolicyConfiguration {
    const programId = this.required(input?.programId, "programId");
    const program = this.references.getProgram(programId);
    this.authorization.assertAuthority(
      principal,
      program.institutionId,
      programId,
    );
    const scopeId = this.required(input?.scopeId, "scopeId");
    if (input.scopeType === "Program") {
      if (scopeId !== programId)
        throw this.invalid("FR-043: Program scopeId must equal programId");
    } else if (input.scopeType === "Cohort") {
      // A Cohort must originate in the trusted INS/Cycle reference, NOT an
      // arbitrary client-supplied string standing in for an AdmissionCycle.
      const cohortKnown = this.references.hasTrustedCohort(programId, scopeId);
      if (!cohortKnown)
        throw this.invalid(
          "FR-043: Cohort must exist in the trusted academic reference",
        );
    } else {
      throw this.invalid("FR-043: scopeType must be Program or Cohort");
    }
    if (!Number.isSafeInteger(input.versionNo) || input.versionNo < 1) {
      throw this.invalid("FR-043: versionNo must be a positive integer");
    }
    const limits = this.validateLimits(input.value);
    const now = new Date().toISOString();
    const from = input.effectiveFrom ?? now;
    if (!this.isUTC(from) || from < now) {
      throw this.invalid(
        "FR-043/BR-062: a new policy may not become effective retroactively",
      );
    }
    const to = input.effectiveTo;
    if (to !== undefined && (!this.isUTC(to) || to <= from)) {
      throw this.invalid("FR-043: effectiveTo must follow effectiveFrom");
    }
    const key = this.key(input.scopeType, scopeId, programId);
    const versions = this.approved.get(key) ?? [];
    const last = versions.at(-1);
    if (
      last &&
      (input.versionNo <= last.versionNo || from <= last.effectiveFrom)
    ) {
      throw this.conflict(
        "FR-043: policy versions must be increasing and effective-dated",
      );
    }
    // Stage immutable copies before audit. A failed audit must NOT mutate
    // the previous effective window (NFR-014), even in the local prototype.
    // Existing enrollment snapshots remain pinned to their historic values.
    const nextVersions = versions.map((record) => this.clone(record));
    const previous = nextVersions.at(-1);
    if (previous && (!previous.effectiveTo || previous.effectiveTo > from)) {
      previous.effectiveTo = from;
    }
    const version: EnrollmentPolicyConfiguration = {
      policyId: randomUUID(),
      policyKey: "EnrollmentStudyLimits",
      scopeType: input.scopeType,
      scopeId,
      programId,
      versionNo: input.versionNo,
      effectiveFrom: from,
      effectiveTo: to,
      approvedByUserId: principal.userId,
      approvedAt: now,
      status: "Approved",
      value: limits,
    };
    this.audit.record(
      principal.userId,
      "postgraduate.enrollment.policy.approved",
      "PolicyConfiguration",
      version.policyId,
      "FR-043/BR-052/BR-062",
    );
    nextVersions.push(version);
    this.approved.set(key, nextVersions);
    return this.clone(version);
  }

  /** Reference-driven Cohort > Program precedence. Never trust an HTTP cohortId. */
  applicable(
    programId: string,
    admissionCycleId: string,
    at: Date = new Date(),
  ): EnrollmentPolicyConfiguration {
    const program = this.references.getProgram(programId);
    const cycle = this.references.getCycle(admissionCycleId);
    if (cycle.programId !== program.programId) {
      throw this.conflict(
        "BR-008/BR-062: admission cycle and program do not match",
      );
    }
    if (!Number.isFinite(at.getTime()))
      throw this.invalid("FR-043: invalid policy date");
    const timestamp = at.toISOString();
    const keys = [
      ...(cycle.cohortId
        ? [this.key("Cohort", cycle.cohortId, programId)]
        : []),
      this.key("Program", programId, programId),
    ];
    for (const key of keys) {
      const active = (this.approved.get(key) ?? []).filter(
        (record) =>
          record.status === "Approved" &&
          record.effectiveFrom <= timestamp &&
          (!record.effectiveTo || timestamp < record.effectiveTo),
      );
      if (active.length > 1)
        throw this.conflict("FR-043: multiple effective policy versions");
      if (active.length === 1) return this.clone(active[0]);
    }
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        "FR-043/BR-052: no approved scoped enrollment policy; configure one before enrollment",
    });
  }

  private validateLimits(
    input: EnrollmentStudyLimits | undefined,
  ): EnrollmentStudyLimits {
    if (!input)
      throw this.invalid("BR-052: study duration limits are required");
    const keys: (keyof EnrollmentStudyLimits)[] = [
      "normalStudyMonths",
      "maxStudyMonths",
      "maxExtensions",
      "maxExtensionMonths",
    ];
    for (const key of keys) {
      const value = input[key];
      if (
        !Number.isSafeInteger(value) ||
        value < (key === "maxExtensions" ? 0 : 1) ||
        value > 1200
      ) {
        throw this.invalid(`BR-052: ${key} must be a valid configured limit`);
      }
    }
    if (input.normalStudyMonths > input.maxStudyMonths) {
      throw this.invalid(
        "BR-052: normal study period exceeds maximum study duration",
      );
    }
    return { ...input };
  }

  private isUTC(value: unknown): value is string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    )
      return false;
    const at = new Date(value);
    return Number.isFinite(at.getTime()) && at.toISOString() === value;
  }

  private required(value: unknown, name: string): string {
    if (typeof value !== "string" || !value.trim())
      throw this.invalid(`FR-043: ${name} is required`);
    return value.trim();
  }
  private clone(
    record: EnrollmentPolicyConfiguration,
  ): EnrollmentPolicyConfiguration {
    return { ...record, value: { ...record.value } };
  }
  private key(
    type: "Program" | "Cohort",
    id: string,
    programId: string,
  ): string {
    return `${programId}\u0000${type}\u0000${id}`;
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
}
