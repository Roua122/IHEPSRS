import type { RoleCode } from "../domain/role-catalogue";

export interface AuthorizationRoleAssignment {
  assignmentId: string;
  roleCode: RoleCode | string;
  institutionId: string | null;
  validFrom: string;
  validTo: string | null;
  delegationId?: string;
}

export interface DataScopeTarget {
  type: string;
  id: string;
}

export interface DataScopeClaim extends DataScopeTarget {
  assignmentId: string;
}

export interface AuthorizationPrincipal {
  userId: string;
  authenticated: true;
  roleAssignments: readonly AuthorizationRoleAssignment[];
  dataScopes?: readonly DataScopeClaim[];
}

export type InstitutionScopeRequirement =
  "NOT_APPLICABLE" | "RESOURCE_INSTITUTION";

export type DataScopeRequirement = "NOT_APPLICABLE" | "MATCH_REQUIRED";

export type RecordStateRequirement =
  { mode: "ANY" } | { mode: "ALLOWED"; states: readonly string[] };

export interface AuthorizationPolicy {
  policyId: string;
  resource: string;
  action: string;
  allowedRoleCodes: readonly RoleCode[];
  institutionScope: InstitutionScopeRequirement;
  dataScope: DataScopeRequirement;
  recordState: RecordStateRequirement;
  requiresReauthentication?: boolean;
}

export interface AuthorizationRequestContext {
  resource: string;
  action: string;
  institutionId?: string | null;
  dataScope?: DataScopeTarget | null;
  recordState?: string | null;
  at?: string;
}

export type AuthorizationDenyReason =
  | "UNAUTHENTICATED"
  | "POLICY_MISMATCH"
  | "NO_ALLOWED_ROLE"
  | "ROLE_ASSIGNMENT_NOT_ACTIVE"
  | "INSTITUTION_SCOPE_REQUIRED"
  | "INSTITUTION_SCOPE_MISMATCH"
  | "DATA_SCOPE_REQUIRED"
  | "DATA_SCOPE_MISMATCH"
  | "RECORD_STATE_REQUIRED"
  | "RECORD_STATE_NOT_ALLOWED";

export interface AuthorizationDecision {
  allowed: boolean;
  policyId: string;
  matchedRoleCode?: RoleCode;
  delegationId?: string;
  reason?: AuthorizationDenyReason;
}
