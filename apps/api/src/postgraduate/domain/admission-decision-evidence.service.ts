import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import type {
  ApplicationSubmissionSnapshot,
  PostgraduateApplication,
} from "./academic.types";
import { AcademicReferenceService } from "./academic-reference.service";

/**
 * TASK-PG-004 / BR-008: caller-provided enrollment references are checked
 * against the accepted application and its immutable submission snapshot.
 * The caller is PG005's trusted domain operation, NOT an applicant HTTP body.
 */
export interface AdmissionEnrollmentTarget {
  personId: string;
  institutionId: string;
  programId: string;
  admissionCycleId: string;
  startDate: string;
}

export interface AdmissionEnrollmentEvidence {
  applicationId: string;
  decisionId: string;
  decisionOutcome: "Accepted" | "ConditionalAccepted";
  decidedAt: string;
  conditionsClearedAt?: string;
  policyVersionId: string;
  personId: string;
  institutionId: string;
  programId: string;
  admissionCycleId: string;
  submissionSnapshotId: string;
  submittedProgramVersionNo: number;
  startDate: string;
  /**
   * BR-008: a program inactive/non-effective on startDate cannot produce an
   * automatically Active enrollment. Other PG005 validations still apply.
   */
  initialEnrollmentStatusIfOtherChecksPass: "Active" | "PendingValidation";
  pendingValidationReason?: "PROGRAM_NOT_EFFECTIVE_AT_START_DATE";
}

/**
 * FR-012/BR-007/BR-008/UC-05. Pure validation over the PG002/PG003 store.
 * Does NOT create an Enrollment or replace the INS program registry.
 * PG005 must invoke this gate before any Enrollment write, transactionally
 * with that write once the team's persistent store is integrated (NFR-014).
 */
@Injectable()
export class AdmissionDecisionEvidenceService {
  constructor(
    private readonly references: AcademicReferenceService,
    private readonly persons: PersonIdentityService,
  ) {}

  /**
   * Refuse formal decision/condition clearance on an unsubmitted or mismapped
   * application. The snapshot preserves the actual source-of-truth identity
   * and program/cycle that were reviewed, rather than client supplied ids.
   */
  assertLatestSubmissionConsistent(
    application: PostgraduateApplication,
  ): ApplicationSubmissionSnapshot {
    const snapshot = application.submissions.at(-1);
    if (
      !snapshot ||
      !application.firstSubmittedAt ||
      !application.submittedAt ||
      snapshot.submittedAt !== application.submittedAt ||
      !Number.isFinite(Date.parse(snapshot.submittedAt))
    ) {
      throw this.conflict("FR-012/BR-008: a current submitted application snapshot is required");
    }
    if (
      snapshot.programId !== application.programId ||
      snapshot.admissionCycleId !== application.admissionCycleId ||
      !this.sameCanonicalPerson(snapshot.personId, application.personId)
    ) {
      throw this.conflict("BR-008: submitted person/program/cycle differs from application");
    }
    const program = this.references.getProgram(application.programId);
    const cycle = this.references.getCycle(application.admissionCycleId);
    if (
      program.institutionId !== application.institutionId ||
      cycle.programId !== application.programId
    ) {
      throw this.conflict("BR-008: source registry program/institution/cycle mismatch");
    }
    return snapshot;
  }

  /**
   * BR-008: PG005 enrollment precondition. Rejected, unreviewed, pending
   * conditional decisions and mismatched applications are always refused.
   * Inactive/non-effective programs yield PendingValidation, never Active.
   */
  assessForEnrollment(
    application: PostgraduateApplication,
    target: AdmissionEnrollmentTarget,
  ): AdmissionEnrollmentEvidence {
    const snapshot = this.assertLatestSubmissionConsistent(application);
    for (const field of [
      "personId",
      "institutionId",
      "programId",
      "admissionCycleId",
    ] as const) {
      if (typeof target?.[field] !== "string" || !target[field].trim()) {
        throw this.invalid(`BR-008: ${field} is required`);
      }
    }
    if (!this.isValidDate(target?.startDate)) {
      throw this.invalid("BR-008: startDate must be a valid YYYY-MM-DD date");
    }
    if (
      !this.sameCanonicalPerson(application.personId, target.personId) ||
      application.institutionId !== target.institutionId ||
      application.programId !== target.programId ||
      application.admissionCycleId !== target.admissionCycleId
    ) {
      throw this.conflict("BR-008: enrollment person/program/cycle/institution mismatch");
    }
    const decision = application.decision;
    if (
      application.status !== "Accepted" ||
      !decision ||
      (decision.outcome !== "Accepted" && decision.outcome !== "ConditionalAccepted") ||
      !decision.decisionId ||
      !decision.decidedByUserId ||
      !decision.reason?.trim() ||
      !decision.policyVersionId?.trim() ||
      !Number.isFinite(Date.parse(decision.decidedAt)) ||
      Date.parse(decision.decidedAt) < Date.parse(snapshot.submittedAt)
    ) {
      throw this.conflict("BR-008: an authorized, recorded Accepted decision is required");
    }
    if (decision.outcome === "ConditionalAccepted") {
      if (
        !decision.conditions?.trim() ||
        !decision.conditionsClearedAt ||
        !Number.isFinite(Date.parse(decision.conditionsClearedAt)) ||
        Date.parse(decision.conditionsClearedAt) < Date.parse(decision.decidedAt)
      ) {
        throw this.conflict("BR-008: conditional admission has not been cleared");
      }
    }

    const program = this.references.getProgram(application.programId);
    const effective =
      program.status === "Active" &&
      this.isValidDate(program.effectiveFrom) &&
      program.effectiveFrom <= target.startDate &&
      (!program.effectiveTo ||
        (this.isValidDate(program.effectiveTo) &&
          program.effectiveTo >= target.startDate));

    return {
      applicationId: application.applicationId,
      decisionId: decision.decisionId,
      decisionOutcome: decision.outcome,
      decidedAt: decision.decidedAt,
      conditionsClearedAt: decision.conditionsClearedAt,
      policyVersionId: decision.policyVersionId,
      personId: this.persons.resolveCanonicalPersonId(application.personId),
      institutionId: application.institutionId,
      programId: application.programId,
      admissionCycleId: application.admissionCycleId,
      submissionSnapshotId: snapshot.snapshotId,
      submittedProgramVersionNo: snapshot.programVersionNo,
      startDate: target.startDate,
      initialEnrollmentStatusIfOtherChecksPass: effective
        ? "Active"
        : "PendingValidation",
      pendingValidationReason: effective
        ? undefined
        : "PROGRAM_NOT_EFFECTIVE_AT_START_DATE",
    };
  }

  private sameCanonicalPerson(a: string, b: string): boolean {
    return (
      this.persons.resolveCanonicalPersonId(a) ===
      this.persons.resolveCanonicalPersonId(b)
    );
  }

  private isValidDate(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const at = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(at.getTime()) && at.toISOString().slice(0, 10) === value;
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
