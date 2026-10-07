import { assertKnownRoleCode, type RoleCode } from "./role-catalogue";

export const ROLE_DELEGATION_STATUSES = [
  "Pending",
  "Active",
  "Expired",
  "Revoked",
] as const;

export type RoleDelegationStatus = (typeof ROLE_DELEGATION_STATUSES)[number];

export interface RoleDelegationProps {
  delegationId: string;
  delegatorUserId: string;
  delegateUserId: string;
  roleCode: string;
  scopeType: string;
  scopeId: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: string;
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`RoleDelegation.${field} is required`);
  }
  return normalized;
}

function parseTimestamp(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`RoleDelegation.${field} must be a valid DateTime`);
  }
  return timestamp;
}

function assertStatus(value: string): asserts value is RoleDelegationStatus {
  if (!ROLE_DELEGATION_STATUSES.includes(value as RoleDelegationStatus)) {
    throw new Error(`Unknown RoleDelegation.status: ${value}`);
  }
}

export class RoleDelegation {
  readonly delegationId: string;
  readonly delegatorUserId: string;
  readonly delegateUserId: string;
  readonly roleCode: RoleCode;
  readonly scopeType: string;
  readonly scopeId: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly reason: string;
  readonly status: RoleDelegationStatus;

  constructor(props: RoleDelegationProps) {
    this.delegationId = requireText(props.delegationId, "delegationId");
    this.delegatorUserId = requireText(
      props.delegatorUserId,
      "delegatorUserId",
    );
    this.delegateUserId = requireText(props.delegateUserId, "delegateUserId");

    const roleCode = requireText(props.roleCode, "roleCode");
    assertKnownRoleCode(roleCode);
    this.roleCode = roleCode;

    this.scopeType = requireText(props.scopeType, "scopeType");
    this.scopeId = requireText(props.scopeId, "scopeId");
    this.startAt = requireText(props.startAt, "startAt");
    this.endAt = requireText(props.endAt, "endAt");
    this.reason = requireText(props.reason, "reason");

    const status = requireText(props.status, "status");
    assertStatus(status);
    this.status = status;

    const startTimestamp = parseTimestamp(this.startAt, "startAt");
    const endTimestamp = parseTimestamp(this.endAt, "endAt");
    if (endTimestamp <= startTimestamp) {
      throw new Error(
        "RoleDelegation.endAt must be later than RoleDelegation.startAt",
      );
    }
  }

  toReferenceSummary() {
    return {
      delegationId: this.delegationId,
      delegatorUserId: this.delegatorUserId,
      delegateUserId: this.delegateUserId,
      roleCode: this.roleCode,
      scopeType: this.scopeType,
      scopeId: this.scopeId,
      startAt: this.startAt,
      endAt: this.endAt,
      reason: this.reason,
      status: this.status,
    };
  }
}
