import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { AuthorizationDecisionService } from "../../identity/authorization/authorization-decision.service";
import type {
  AuthorizationPolicy,
  AuthorizationPrincipal,
} from "../../identity/authorization/authorization.types";

function policy(
  action: "Manage" | "Decide",
  codes: ("PGO" | "PGA")[],
): AuthorizationPolicy {
  return {
    policyId: `POSTGRADUATE-${action}`,
    resource: "Postgraduate",
    action,
    allowedRoleCodes: codes,
    institutionScope: "RESOURCE_INSTITUTION",
    dataScope: "NOT_APPLICABLE",
    recordState: { mode: "ANY" },
  };
}

const OPERATE = policy("Manage", ["PGO", "PGA"]);
const DECIDE = policy("Decide", ["PGA"]);

@Injectable()
export class AcademicAuthorizationService {
  constructor(private readonly decisions: AuthorizationDecisionService) {}

  assertApplicant(principal: AuthorizationPrincipal, personId: string): void {
    if (!principal?.authenticated || !principal.personId || !personId) {
      throw this.deny("APPLICANT_UNAUTHENTICATED");
    }
    if (principal.personId !== personId) {
      throw this.deny("APPLICANT_SELF_SCOPE_MISMATCH");
    }
  }

  assertOfficer(
    principal: AuthorizationPrincipal,
    institutionId: string,
    programId: string,
  ): void {
    this.assertStaff(OPERATE, principal, institutionId, programId);
  }

  assertAuthority(
    principal: AuthorizationPrincipal,
    institutionId: string,
    programId: string,
  ): void {
    this.assertStaff(DECIDE, principal, institutionId, programId);
  }

  canRead(
    principal: AuthorizationPrincipal,
    personId: string,
    institutionId: string,
    programId: string,
  ): boolean {
    if (principal?.authenticated && principal.personId === personId)
      return true;
    try {
      this.assertOfficer(principal, institutionId, programId);
      return true;
    } catch {
      return false;
    }
  }

  private assertStaff(
    policy: AuthorizationPolicy,
    principal: AuthorizationPrincipal,
    institutionId: string,
    programId: string,
  ): void {
    const decision = this.decisions.evaluate(
      principal,
      { resource: policy.resource, action: policy.action, institutionId },
      policy,
    );
    if (!decision.allowed) throw this.deny(decision.reason ?? "ACCESS_DENIED");
    // Restrict program-delegated assignments when program DataScope claims exist.
    const assignment = principal.roleAssignments.find(
      (candidate) =>
        candidate.roleCode === decision.matchedRoleCode &&
        (candidate.institutionId === institutionId ||
          candidate.institutionId === null) &&
        candidate.validFrom <= new Date().toISOString() &&
        (!candidate.validTo || candidate.validTo > new Date().toISOString()),
    );
    if (!assignment) throw this.deny("INACTIVE_ASSIGNMENT");
    const programClaims = principal.dataScopes?.filter(
      (scope) =>
        scope.assignmentId === assignment.assignmentId &&
        scope.type === "Program",
    );
    if (
      programClaims?.length &&
      !programClaims.some((scope) => scope.id === programId)
    ) {
      throw this.deny("PROGRAM_SCOPE_MISMATCH");
    }
  }

  private deny(reason: string): AppException {
    return new AppException({
      code: ErrorCode.Forbidden,
      status: HttpStatus.FORBIDDEN,
      message: "Access denied by Postgraduate role/person scope",
      details: { reason },
    });
  }
}
