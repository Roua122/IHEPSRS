import { HttpStatus, Injectable } from "@nestjs/common";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { DefenseCommitteeMember } from "./thesis-defense.types";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";

/** Authorized institutional evidence, not a browser claim that an examiner is eligible. */
export interface DefenseMemberAttestationInput {
  thesisId: string;
  enrollmentId: string;
  studentPersonId: string;
  institutionId: string;
  programId: string;
  member: DefenseCommitteeMember;
  conflictDeclared: boolean;
  reason: string;
  principal: AuthorizationPrincipal;
}

export interface DefenseMemberAttestation {
  attestationId: string;
  thesisId: string;
  institutionId: string;
  programId: string;
  member: DefenseCommitteeMember;
  conflictDeclared: boolean;
  reason: string;
  attestedByUserId: string;
  attestedAt: string;
}

/** External conflict-of-interest/committee eligibility checks (FR-018, UC-08).
 * A client declaration or an unverified role label is not eligibility evidence.
 */
export abstract class DefenseEligibilityGateway {
  abstract assertEligible(input: {
    thesisId: string;
    enrollmentId: string;
    studentPersonId?: string;
    institutionId: string;
    programId: string;
    members: readonly DefenseCommitteeMember[];
  }): Promise<void>;

  /** Unconfigured adapters cannot manufacture trusted attestations. */
  async recordAttestation(
    _input: DefenseMemberAttestationInput,
  ): Promise<DefenseMemberAttestation> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        "FR-018: institutional committee attestation adapter is not configured",
    });
  }
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
