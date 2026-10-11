import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import type {
  ApplicationSubmissionSnapshot,
  PostgraduateApplication,
} from "./academic.types";
import { AcademicReferenceService } from "./academic-reference.service";

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
  initialEnrollmentStatusIfOtherChecksPass: "Active" | "PendingValidation";
  pendingValidationReason?: "PROGRAM_NOT_EFFECTIVE_AT_START_DATE";
}

@Injectable()
export class AdmissionDecisionEvidenceService {
  constructor(
    private readonly references: AcademicReferenceService,
    private readonly persons: PersonIdentityService,
  ) {}

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
      throw this.conflict(
        "FR-012/BR-008: a current submitted application snapshot is required",
      );
    }

    if (
      snapshot.programId !== application.programId ||
      snapshot.admissionCycleId !== application.admissionCycleId ||
      !this.sameCanonicalPerson(snapshot.personId, application.personId)
    ) {
      throw this.conflict(
        "BR-008: submitted person/program/cycle differs from application",
      );
    }

    const program = this.references.getProgram(application.programId);
    const cycle = this.references.getCycle(application.admissionCycleId);

    if (
      program.institutionId !== application.institutionId ||
      cycle.programId !== application.programId
    ) {
      throw this.conflict(
        "BR-008: source registry program/institution/cycle mismatch",
      );
    }

    return snapshot;
  }

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
      throw this.conflict(
        "BR-008: enrollment person/program/cycle/institution mismatch",
      );
    }

    const decision = application.decision;

    if (
      application.status !== "Accepted" ||
      !decision ||
      (decision.outcome !== "Accepted" &&
        decision.outcome !== "ConditionalAccepted") ||
      !decision.decisionId ||
      !decision.decidedByUserId ||
      !decision.reason?.trim() ||
      !decision.policyVersionId?.trim() ||
      !Number.isFinite(Date.parse(decision.decidedAt)) ||
      Date.parse(decision.decidedAt) < Date.parse(snapshot.submittedAt)
    ) {
      throw this.conflict(
        "BR-008: an authorized, recorded Accepted decision is required",
      );
    }

    if (decision.outcome === "ConditionalAccepted") {
      if (
        !decision.conditions?.trim() ||
        !decision.conditionsClearedAt ||
        !Number.isFinite(Date.parse(decision.conditionsClearedAt)) ||
        Date.parse(decision.conditionsClearedAt) <
          Date.parse(decision.decidedAt)
      ) {
        throw this.conflict(
          "BR-008: conditional admission has not been cleared",
        );
      }
    }

    const effective = this.references.isProgramEffective(
      application.programId,
      target.startDate,
    );

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
    return (
      Number.isFinite(at.getTime()) && at.toISOString().slice(0, 10) === value
    );
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
