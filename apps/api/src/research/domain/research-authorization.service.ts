import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { writeStructuredLog } from "../../common/observability/structured-log";
import { AuthorizationDecisionService } from "../../identity/authorization/authorization-decision.service";
import type {
  AuthorizationPolicy,
  AuthorizationPrincipal,
} from "../../identity/authorization/authorization.types";

const RESEARCH_OPERATIONS_POLICY: AuthorizationPolicy = {
  policyId: "RESEARCH-OPERATIONS-INSTITUTION",
  resource: "Research",
  action: "Manage",
  allowedRoleCodes: ["RA", "RO"],
  institutionScope: "RESOURCE_INSTITUTION",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

const RESEARCH_DECISION_POLICY: AuthorizationPolicy = {
  policyId: "RESEARCH-DECISION-INSTITUTION",
  resource: "Research",
  action: "Decide",
  allowedRoleCodes: ["RA"],
  institutionScope: "RESOURCE_INSTITUTION",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

const IDENTITY_STEWARD_ROLE_POLICY: AuthorizationPolicy = {
  policyId: "PERSON-IDENTITY-STEWARD-ROLE",
  resource: "PersonIdentity",
  action: "Search",
  allowedRoleCodes: ["DS"],
  institutionScope: "NOT_APPLICABLE",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

const IDENTITY_STEWARD_POLICY: AuthorizationPolicy = {
  policyId: "PERSON-IDENTITY-STEWARD",
  resource: "PersonIdentity",
  action: "Resolve",
  allowedRoleCodes: ["DS"],
  institutionScope: "NOT_APPLICABLE",
  dataScope: "MATCH_REQUIRED",
  recordState: { mode: "ANY" },
};

@Injectable()
export class ResearchAuthorizationService {
  constructor(private readonly decisions: AuthorizationDecisionService) {}

  assertResearchOperation(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): void {
    this.assertDecision(principal, RESEARCH_OPERATIONS_POLICY, {
      institutionId,
    });
  }

  assertResearchDecision(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): void {
    this.assertDecision(principal, RESEARCH_DECISION_POLICY, {
      institutionId,
    });
  }

  assertAnyResearchInstitution(
    principal: AuthorizationPrincipal | undefined,
    institutionIds: readonly string[],
  ): void {
    const unique = [...new Set(institutionIds.filter(Boolean))];
    if (unique.length === 0) {
      throw this.forbidden("RESEARCH_INSTITUTION_REQUIRED");
    }

    for (const institutionId of unique) {
      const decision = this.decisions.evaluate(
        principal,
        {
          resource: RESEARCH_OPERATIONS_POLICY.resource,
          action: RESEARCH_OPERATIONS_POLICY.action,
          institutionId,
        },
        RESEARCH_OPERATIONS_POLICY,
      );
      if (decision.allowed) return;
    }

    throw this.forbidden("INSTITUTION_SCOPE_MISMATCH");
  }

  assertIdentityStewardRole(
    principal: AuthorizationPrincipal | undefined,
  ): void {
    this.assertDecision(principal, IDENTITY_STEWARD_ROLE_POLICY, {});
  }

  assertIdentitySteward(
    principal: AuthorizationPrincipal | undefined,
    personId: string,
  ): void {
    this.assertDecision(principal, IDENTITY_STEWARD_POLICY, {
      dataScope: { type: "Person", id: personId },
    });
  }

  canResolvePerson(
    principal: AuthorizationPrincipal | undefined,
    personId: string,
  ): boolean {
    return this.decisions.evaluate(
      principal,
      {
        resource: IDENTITY_STEWARD_POLICY.resource,
        action: IDENTITY_STEWARD_POLICY.action,
        dataScope: { type: "Person", id: personId },
      },
      IDENTITY_STEWARD_POLICY,
    ).allowed;
  }

  canManageInstitution(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): boolean {
    return this.decisions.evaluate(
      principal,
      {
        resource: RESEARCH_OPERATIONS_POLICY.resource,
        action: RESEARCH_OPERATIONS_POLICY.action,
        institutionId,
      },
      RESEARCH_OPERATIONS_POLICY,
    ).allowed;
  }

  private assertDecision(
    principal: AuthorizationPrincipal | undefined,
    policy: AuthorizationPolicy,
    context: {
      institutionId?: string;
      dataScope?: { type: string; id: string };
    },
  ): void {
    const decision = this.decisions.evaluate(
      principal,
      {
        resource: policy.resource,
        action: policy.action,
        institutionId: context.institutionId,
        dataScope: context.dataScope,
      },
      policy,
    );

    if (decision.allowed) return;

    writeStructuredLog({
      level: "warn",
      event: "research.authorization.denied",
      userId: principal?.userId,
      policyId: policy.policyId,
      reason: decision.reason,
    });
    throw this.forbidden(decision.reason ?? "ACCESS_DENIED");
  }

  private forbidden(reason: string): AppException {
    return new AppException({
      code: ErrorCode.Forbidden,
      status: HttpStatus.FORBIDDEN,
      message: "Access denied by research authorization policy",
      details: { reason },
    });
  }
}
