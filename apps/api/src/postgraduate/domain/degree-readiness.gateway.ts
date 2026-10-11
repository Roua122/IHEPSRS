import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";

/**
 * BR-054: trusted, server-side evidence only. Never take these booleans from
 * an applicant/approver HTTP request. Needs integration with TH and program
 * requirements/Holds owners before a DegreeDecision can be created.
 */
export interface DegreeReadinessEvidence {
  programRequirementsComplete: boolean;
  thesisApproved: boolean;
  noMandatoryHolds: boolean;
  evidenceRefs: readonly string[];
}

export interface DegreeReadinessQuery {
  enrollmentId: string;
  studentId: string;
  personId: string;
  institutionId: string;
  programId: string;
  thesisRequired: boolean;
}

export abstract class DegreeReadinessGateway {
  abstract assess(
    query: DegreeReadinessQuery,
  ): Promise<DegreeReadinessEvidence>;
}

/** Fail closed until verified ProgramRequirements, Thesis and Holds adapters exist. */
@Injectable()
export class UnavailableDegreeReadinessGateway extends DegreeReadinessGateway {
  async assess(_query: DegreeReadinessQuery): Promise<DegreeReadinessEvidence> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: "BR-054: trusted degree readiness services are not integrated",
    });
  }
}
