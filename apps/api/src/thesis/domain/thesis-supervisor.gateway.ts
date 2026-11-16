import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";

/**
 * TH002-owned source-of-truth boundary. Evidence must reflect an approved,
 * currently Active Main SupervisorAssignment for this Thesis/Enrollment;
 * implementations must also verify the Enrollment is Active (UC-07/BR-011).
 */
export interface ActiveMainSupervisorEvidence {
  thesisId: string;
  enrollmentId: string;
  assignmentId: string;
}

export abstract class ThesisSupervisorGateway {
  /** Server-side assignment lookup: never trust a client-supplied supervisor ID. */
  abstract assertActiveMainSupervisor(
    thesisId: string,
    enrollmentId: string,
  ): Promise<ActiveMainSupervisorEvidence>;

  /**
   * Authenticate the actual supervisor reviewer (Student/PGO role is NOT
   * sufficient). Check the principal against the active assigned researcher
   * through trusted TH002 identity mappings; return its assignment evidence.
   */
  abstract assertAssignedMainSupervisor(
    thesisId: string,
    enrollmentId: string,
    principal: AuthorizationPrincipal,
  ): Promise<ActiveMainSupervisorEvidence>;
}

/** Fail closed until TH002 assignment/identity integration is available. */
@Injectable()
export class UnavailableThesisSupervisorGateway extends ThesisSupervisorGateway {
  private unavailable(): never {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        "UC-07/BR-011: approved Main Supervisor service not integrated (TH002)",
    });
  }

  async assertActiveMainSupervisor(
    _thesisId: string,
    _enrollmentId: string,
  ): Promise<ActiveMainSupervisorEvidence> {
    return this.unavailable();
  }

  async assertAssignedMainSupervisor(
    _thesisId: string,
    _enrollmentId: string,
    _principal: AuthorizationPrincipal,
  ): Promise<ActiveMainSupervisorEvidence> {
    return this.unavailable();
  }
}
