import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../common/errors/app-exception";
import { ErrorCode } from "../common/errors/error-code";
import { writeStructuredLog } from "../common/observability/structured-log";
import { AuthorizationDecisionService } from "../identity/authorization/authorization-decision.service";
import type {
  AuthorizationPolicy,
  AuthorizationPrincipal,
} from "../identity/authorization/authorization.types";

const REGISTRY_CENTRAL_POLICY: AuthorizationPolicy = {
  policyId: "INSTITUTION-REGISTRY-CENTRAL",
  resource: "InstitutionRegistry",
  action: "Manage",
  allowedRoleCodes: ["CGA", "IRS"],
  institutionScope: "NOT_APPLICABLE",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

const INSTITUTION_MASTER_DATA_POLICY: AuthorizationPolicy = {
  policyId: "INSTITUTION-MASTER-DATA",
  resource: "InstitutionMasterData",
  action: "Manage",
  allowedRoleCodes: ["CGA", "IRS", "UA"],
  institutionScope: "RESOURCE_INSTITUTION",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

const REFERENCE_CENTRAL_POLICY: AuthorizationPolicy = {
  policyId: "REFERENCE-DATA-CENTRAL",
  resource: "ReferenceData",
  action: "Manage",
  allowedRoleCodes: ["CGA", "IRS"],
  institutionScope: "NOT_APPLICABLE",
  dataScope: "NOT_APPLICABLE",
  recordState: { mode: "ANY" },
};

@Injectable()
export class InstitutionAuthorizationService {
  constructor(private readonly decisions: AuthorizationDecisionService) {}

  assertCentralRegistry(principal: AuthorizationPrincipal | undefined): void {
    this.assert(principal, REGISTRY_CENTRAL_POLICY, {});
  }

  assertInstitutionMasterData(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): void {
    this.assert(principal, INSTITUTION_MASTER_DATA_POLICY, { institutionId });
  }

  assertReferenceCentral(principal: AuthorizationPrincipal | undefined): void {
    this.assert(principal, REFERENCE_CENTRAL_POLICY, {});
  }

  assertPolicyScope(
    principal: AuthorizationPrincipal | undefined,
    scope: {
      type: "Central" | "Institution" | "Program" | "Cohort";
      institutionId?: string;
    },
  ): void {
    if (scope.type === "Central" || scope.type === "Cohort") {
      this.assertCentralRegistry(principal);
      return;
    }
    if (!scope.institutionId) {
      throw this.forbidden("POLICY_INSTITUTION_SCOPE_REQUIRED");
    }
    this.assertInstitutionMasterData(principal, scope.institutionId);
  }

  canManageInstitution(
    principal: AuthorizationPrincipal | undefined,
    institutionId: string,
  ): boolean {
    return this.decisions.evaluate(
      principal,
      {
        resource: INSTITUTION_MASTER_DATA_POLICY.resource,
        action: INSTITUTION_MASTER_DATA_POLICY.action,
        institutionId,
      },
      INSTITUTION_MASTER_DATA_POLICY,
    ).allowed;
  }

  canManageCentralRegistry(
    principal: AuthorizationPrincipal | undefined,
  ): boolean {
    return this.decisions.evaluate(
      principal,
      {
        resource: REGISTRY_CENTRAL_POLICY.resource,
        action: REGISTRY_CENTRAL_POLICY.action,
      },
      REGISTRY_CENTRAL_POLICY,
    ).allowed;
  }

  private assert(
    principal: AuthorizationPrincipal | undefined,
    policy: AuthorizationPolicy,
    context: { institutionId?: string },
  ): void {
    const decision = this.decisions.evaluate(
      principal,
      {
        resource: policy.resource,
        action: policy.action,
        institutionId: context.institutionId,
      },
      policy,
    );
    if (decision.allowed) return;

    writeStructuredLog({
      level: "warn",
      event: "institution.authorization.denied",
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
      message: "Access denied by institution authorization policy",
      details: { reason },
    });
  }
}
