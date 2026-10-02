import type {
  AuthorizationRoleAssignment,
  DataScopeClaim,
} from "../authorization/authorization.types";
import type { RoleDelegation } from "../domain/role-delegation";

export interface DelegationCreationContext {
  at: string;
  delegatorRoleAssignments: readonly AuthorizationRoleAssignment[];
  delegatorDataScopes?: readonly DataScopeClaim[];
}

export type DelegationValidationDenyReason =
  | "INVALID_TIME"
  | "DELEGATION_NOT_PENDING_OR_ACTIVE"
  | "DELEGATOR_ROLE_NOT_HELD"
  | "DELEGATOR_ROLE_NOT_ACTIVE"
  | "SCOPE_NOT_COVERED";

export interface DelegationValidationDecision {
  allowed: boolean;
  sourceAssignmentId?: string;
  reason?: DelegationValidationDenyReason;
}

export interface DelegationEffectivenessContext {
  at: string;
  delegatorAccountActive: boolean;
  delegateAccountActive: boolean;
  originalRoleAssignmentActive: boolean;
}

export type DelegationInactiveReason =
  | "INVALID_TIME"
  | "NOT_ACTIVE_STATUS"
  | "NOT_STARTED"
  | "END_REACHED"
  | "ACCOUNT_DISABLED"
  | "ORIGINAL_ROLE_REVOKED";

export interface DelegationEffectivenessDecision {
  effective: boolean;
  reason?: DelegationInactiveReason;
}

export interface DelegatedAuthorizationGrant {
  roleAssignment: AuthorizationRoleAssignment;
  dataScope: DataScopeClaim;
}

export interface DelegationGrantInput {
  delegation: RoleDelegation;
  effectiveness: DelegationEffectivenessContext;
}
