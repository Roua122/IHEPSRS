import {
  getRoleDefinition,
  isKnownRoleCode,
  type RoleCode,
} from "../domain/role-catalogue";
import type {
  AuthorizationDecision,
  AuthorizationPolicy,
  AuthorizationPrincipal,
  AuthorizationRequestContext,
  AuthorizationRoleAssignment,
  DataScopeClaim,
  DataScopeTarget,
} from "./authorization.types";

function parseTime(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isAssignmentActive(
  assignment: AuthorizationRoleAssignment,
  at: number,
): boolean {
  const validFrom = parseTime(assignment.validFrom);
  if (validFrom === null || at < validFrom) {
    return false;
  }

  if (!assignment.validTo) {
    return true;
  }

  const validTo = parseTime(assignment.validTo);
  return validTo !== null && at < validTo;
}

function supportsCrossInstitutionScope(roleCode: RoleCode): boolean {
  const scope = getRoleDefinition(roleCode)?.scope;
  return scope === "Cross-Institution" || scope === "Cross/Institution";
}

function dataScopeEquals(
  left: DataScopeClaim,
  right: DataScopeTarget,
): boolean {
  return left.type === right.type && left.id === right.id;
}

export class AuthorizationDecisionService {
  evaluate(
    principal: AuthorizationPrincipal | undefined,
    request: AuthorizationRequestContext,
    policy: AuthorizationPolicy,
  ): AuthorizationDecision {
    if (!principal?.authenticated) {
      return this.deny(policy, "UNAUTHENTICATED");
    }

    if (
      request.resource !== policy.resource ||
      request.action !== policy.action
    ) {
      return this.deny(policy, "POLICY_MISMATCH");
    }

    const at = parseTime(request.at ?? new Date().toISOString());
    if (at === null) {
      return this.deny(policy, "ROLE_ASSIGNMENT_NOT_ACTIVE");
    }

    const knownAllowedRoleCodes = new Set<RoleCode>(policy.allowedRoleCodes);
    const roleCandidates = principal.roleAssignments.filter((assignment) => {
      if (!isKnownRoleCode(assignment.roleCode)) {
        return false;
      }
      return knownAllowedRoleCodes.has(assignment.roleCode);
    });

    if (roleCandidates.length === 0) {
      return this.deny(policy, "NO_ALLOWED_ROLE");
    }

    const activeCandidates = roleCandidates.filter((assignment) =>
      isAssignmentActive(assignment, at),
    );

    if (activeCandidates.length === 0) {
      return this.deny(policy, "ROLE_ASSIGNMENT_NOT_ACTIVE");
    }

    if (policy.institutionScope === "RESOURCE_INSTITUTION") {
      const targetInstitutionId = request.institutionId?.trim();
      if (!targetInstitutionId) {
        return this.deny(policy, "INSTITUTION_SCOPE_REQUIRED");
      }

      const institutionScoped = activeCandidates.filter((assignment) => {
        if (!isKnownRoleCode(assignment.roleCode)) {
          return false;
        }

        if (assignment.institutionId === targetInstitutionId) {
          return true;
        }

        return (
          assignment.institutionId === null &&
          supportsCrossInstitutionScope(assignment.roleCode)
        );
      });

      if (institutionScoped.length === 0) {
        return this.deny(policy, "INSTITUTION_SCOPE_MISMATCH");
      }

      activeCandidates.splice(0, activeCandidates.length, ...institutionScoped);
    }

    if (policy.dataScope === "MATCH_REQUIRED") {
      const requiredDataScope = request.dataScope;
      if (!requiredDataScope?.type.trim() || !requiredDataScope.id.trim()) {
        return this.deny(policy, "DATA_SCOPE_REQUIRED");
      }

      const dataScopedCandidates = activeCandidates.filter((assignment) =>
        principal.dataScopes?.some(
          (claim) =>
            claim.assignmentId === assignment.assignmentId &&
            dataScopeEquals(claim, requiredDataScope),
        ),
      );

      if (dataScopedCandidates.length === 0) {
        return this.deny(policy, "DATA_SCOPE_MISMATCH");
      }

      activeCandidates.splice(
        0,
        activeCandidates.length,
        ...dataScopedCandidates,
      );
    }

    if (policy.recordState.mode === "ALLOWED") {
      const state = request.recordState?.trim();
      if (!state) {
        return this.deny(policy, "RECORD_STATE_REQUIRED");
      }
      if (!policy.recordState.states.includes(state)) {
        return this.deny(policy, "RECORD_STATE_NOT_ALLOWED");
      }
    }

    const matchedRoleCode = activeCandidates.find((assignment) =>
      isKnownRoleCode(assignment.roleCode),
    )?.roleCode;

    if (!matchedRoleCode || !isKnownRoleCode(matchedRoleCode)) {
      return this.deny(policy, "NO_ALLOWED_ROLE");
    }

    return {
      allowed: true,
      policyId: policy.policyId,
      matchedRoleCode,
    };
  }

  private deny(
    policy: AuthorizationPolicy,
    reason: Exclude<AuthorizationDecision["reason"], undefined>,
  ): AuthorizationDecision {
    return {
      allowed: false,
      policyId: policy.policyId,
      reason,
    };
  }
}
