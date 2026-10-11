import { HttpStatus, Injectable } from "@nestjs/common";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { DefenseCommitteeMember } from "./thesis-defense.types";

/** External conflict-of-interest/committee eligibility checks (FR-018, UC-08).
 * A client declaration or an unverified role label is not eligibility evidence.
 */
export abstract class DefenseEligibilityGateway {
  abstract assertEligible(input: {
    thesisId: string;
    enrollmentId: string;
    institutionId: string;
    programId: string;
    members: readonly DefenseCommitteeMember[];
  }): Promise<void>;
}
@Injectable()
export class UnavailableDefenseEligibilityGateway extends DefenseEligibilityGateway {
  async assertEligible(): Promise<void> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        "FR-018/BR-016: trusted defense committee eligibility service is not configured",
    });
  }
}
