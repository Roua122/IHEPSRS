import { assertKnownRoleCode, type RoleCode } from "./role-catalogue";

export interface RoleAssignmentProps {
  assignmentId: string;
  userId: string;
  roleCode: string;
  institutionId?: string | null;
  validFrom: string;
  validTo?: string | null;
  grantedBy: string;
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`RoleAssignment.${field} is required`);
  }
  return normalized;
}

function parseTimestamp(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`RoleAssignment.${field} must be a valid DateTime`);
  }
  return timestamp;
}

export class RoleAssignment {
  readonly assignmentId: string;
  readonly userId: string;
  readonly roleCode: RoleCode;
  readonly institutionId: string | null;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly grantedBy: string;

  constructor(props: RoleAssignmentProps) {
    this.assignmentId = requireText(props.assignmentId, "assignmentId");
    this.userId = requireText(props.userId, "userId");

    const roleCode = requireText(props.roleCode, "roleCode");
    assertKnownRoleCode(roleCode);
    this.roleCode = roleCode;

    this.institutionId = props.institutionId?.trim() || null;
    this.validFrom = requireText(props.validFrom, "validFrom");
    this.validTo = props.validTo?.trim() || null;
    this.grantedBy = requireText(props.grantedBy, "grantedBy");

    const validFromTimestamp = parseTimestamp(this.validFrom, "validFrom");

    if (this.validTo) {
      const validToTimestamp = parseTimestamp(this.validTo, "validTo");
      if (validToTimestamp <= validFromTimestamp) {
        throw new Error(
          "RoleAssignment.validTo must be later than RoleAssignment.validFrom",
        );
      }
    }
  }

  toReferenceSummary() {
    return {
      assignmentId: this.assignmentId,
      userId: this.userId,
      roleCode: this.roleCode,
      institutionId: this.institutionId,
      validFrom: this.validFrom,
      validTo: this.validTo,
      grantedBy: this.grantedBy,
    };
  }
}
