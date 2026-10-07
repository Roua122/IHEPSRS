import { getRoleDefinition, isKnownRoleCode } from "../domain/role-catalogue";
import type { RoleDelegation } from "../domain/role-delegation";
import type {
  AuthorizationRoleAssignment,
  DataScopeClaim,
} from "../authorization/authorization.types";
import type {
  DelegationCreationContext,
  DelegationEffectivenessContext,
  DelegationEffectivenessDecision,
  DelegationValidationDecision,
} from "./delegation.types";

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

function supportsCrossInstitutionScope(roleCode: string): boolean {
  if (!isKnownRoleCode(roleCode)) {
    return false;
  }

  const scope = getRoleDefinition(roleCode)?.scope;
  return scope === "Cross-Institution" || scope === "Cross/Institution";
}

function dataScopeMatches(
  claim: DataScopeClaim,
  assignmentId: string,
  scopeType: string,
  scopeId: string,
): boolean {
  return (
    claim.assignmentId === assignmentId &&
    claim.type === scopeType &&
    claim.id === scopeId
  );
}

export class DelegationPolicyService {
  validateCreation(
    delegation: RoleDelegation,
    context: DelegationCreationContext,
  ): DelegationValidationDecision {
    const at = parseTime(context.at);
    if (at === null) {
      return { allowed: false, reason: "INVALID_TIME" };
    }

    if (delegation.status !== "Pending" && delegation.status !== "Active") {
      return {
        allowed: false,
        reason: "DELEGATION_NOT_PENDING_OR_ACTIVE",
      };
    }

    const sameRoleAssignments = context.delegatorRoleAssignments.filter(
      (assignment) =>
        assignment.roleCode === delegation.roleCode &&
        isKnownRoleCode(assignment.roleCode),
    );

    if (sameRoleAssignments.length === 0) {
      return { allowed: false, reason: "DELEGATOR_ROLE_NOT_HELD" };
    }

    const activeAssignments = sameRoleAssignments.filter((assignment) =>
      isAssignmentActive(assignment, at),
    );

    if (activeAssignments.length === 0) {
      return { allowed: false, reason: "DELEGATOR_ROLE_NOT_ACTIVE" };
    }

    const coveringAssignment = activeAssignments.find((assignment) =>
      this.assignmentCoversScope(
        assignment,
        context.delegatorDataScopes ?? [],
        delegation.scopeType,
        delegation.scopeId,
      ),
    );

    if (!coveringAssignment) {
      return { allowed: false, reason: "SCOPE_NOT_COVERED" };
    }

    return {
      allowed: true,
      sourceAssignmentId: coveringAssignment.assignmentId,
    };
  }

  evaluateEffectiveness(
    delegation: RoleDelegation,
    context: DelegationEffectivenessContext,
  ): DelegationEffectivenessDecision {
    const at = parseTime(context.at);
    const startAt = parseTime(delegation.startAt);
    const endAt = parseTime(delegation.endAt);

    if (at === null || startAt === null || endAt === null) {
      return { effective: false, reason: "INVALID_TIME" };
    }

    if (delegation.status !== "Active") {
      return { effective: false, reason: "NOT_ACTIVE_STATUS" };
    }

    if (at < startAt) {
      return { effective: false, reason: "NOT_STARTED" };
    }

    if (at >= endAt) {
      return { effective: false, reason: "END_REACHED" };
    }

    if (!context.delegatorAccountActive || !context.delegateAccountActive) {
      return { effective: false, reason: "ACCOUNT_DISABLED" };
    }

    if (!context.originalRoleAssignmentActive) {
      return { effective: false, reason: "ORIGINAL_ROLE_REVOKED" };
    }

    return { effective: true };
  }

  private assignmentCoversScope(
    assignment: AuthorizationRoleAssignment,
    dataScopes: readonly DataScopeClaim[],
    scopeType: string,
    scopeId: string,
  ): boolean {
    if (scopeType === "Institution" && assignment.institutionId === scopeId) {
      return true;
    }

    if (
      scopeType === "Institution" &&
      assignment.institutionId === null &&
      supportsCrossInstitutionScope(assignment.roleCode)
    ) {
      return true;
    }

    return dataScopes.some((claim) =>
      dataScopeMatches(claim, assignment.assignmentId, scopeType, scopeId),
    );
  }
}
