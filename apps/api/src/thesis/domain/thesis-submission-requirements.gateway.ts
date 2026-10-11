import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";

/**
 * TASK-TH-004 / UC-08 / Baseline 11.1, InProgress -> Submitted.
 * Program requirements are determined by the owning academic program's
 * versioned policy. The Thesis API must not accept `requirementsMet: true`
 * or invent program requirements on behalf of that authoritative service.
 */
export interface ThesisSubmissionRequirementsEvidence {
  thesisId: string;
  enrollmentId: string;
  programId: string;
  requirementsSatisfied: true;
  policyVersionId: string;
  assessmentId: string;
}

export abstract class ThesisSubmissionRequirementsGateway {
  abstract assertSatisfied(
    thesisId: string,
    enrollmentId: string,
    programId: string,
  ): Promise<ThesisSubmissionRequirementsEvidence>;
}

/** Fail closed until the program-policy/requirements adapter is connected. */
@Injectable()
export class UnavailableThesisSubmissionRequirementsGateway
  extends ThesisSubmissionRequirementsGateway {
  async assertSatisfied(
    _thesisId: string,
    _enrollmentId: string,
    _programId: string,
  ): Promise<ThesisSubmissionRequirementsEvidence> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: "UC-08/FR-016: trusted program submission requirements are not integrated",
    });
  }
}
