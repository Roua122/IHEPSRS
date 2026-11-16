import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../common/errors/app-exception";
import { ErrorCode } from "../common/errors/error-code";
import { writeStructuredLog } from "../common/observability/structured-log";
import { AuthorizationDecisionService } from "../identity/authorization/authorization-decision.service";
import type {
  AuthorizationPolicy,
  AuthorizationPrincipal,
} from "../identity/authorization/authorization.types";

const THESIS_SUPERVISION_VIEW_POLICY: AuthorizationPolicy = {
  policyId: "THESIS-SUPERVISION-VIEW",
  resource: "ThesisSupervision",
  action: "View",
  allowedRoleCodes: ["PGA", "PGO"],
  institutionScope: "RESOURCE_INSTITUTION",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

const THESIS_SUPERVISION_APPROVE_POLICY: AuthorizationPolicy = {
  policyId: "THESIS-SUPERVISION-APPROVE",
  resource: "ThesisSupervision",
  action: "Approve",
  allowedRoleCodes: ["PGA"],
  institutionScope: "RESOURCE_INSTITUTION",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

@Injectable()
export class ThesisAuthorizationService {
  constructor(private readonly decisions: AuthorizationDecisionService) {}

  assertView(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): void {
    this.assert(principal, THESIS_SUPERVISION_VIEW_POLICY, institutionId);
  }

  assertApprove(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): void {
    this.assert(principal, THESIS_SUPERVISION_APPROVE_POLICY, institutionId);
  }

  private assert(
    principal: AuthorizationPrincipal | undefined,
    policy: AuthorizationPolicy,
    institutionId: string,
  ): void {
    const decision = this.decisions.evaluate(
      principal,
      {
        resource: policy.resource,
        action: policy.action,
        institutionId,
      },
      policy,
    );
    if (decision.allowed) return;

    writeStructuredLog({
      level: "warn",
      event: "thesis.supervision.authorization.denied",
      userId: principal?.userId,
      policyId: policy.policyId,
      reason: decision.reason,
    });
    throw new AppException({
      code: ErrorCode.Forbidden,
      status: HttpStatus.FORBIDDEN,
      message: "Access denied by thesis supervision authorization policy",
      details: { reason: decision.reason ?? "ACCESS_DENIED" },
    });
  }
}
