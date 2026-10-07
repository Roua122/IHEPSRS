import type { DataScopeClaim } from "../authorization/authorization.types";
import type { RoleDelegation } from "../domain/role-delegation";
import { DelegationPolicyService } from "./delegation-policy.service";
import type {
  DelegatedAuthorizationGrant,
  DelegationEffectivenessContext,
} from "./delegation.types";

export class DelegationAuthorizationService {
  constructor(private readonly policies = new DelegationPolicyService()) {}

  toAuthorizationGrant(
    delegation: RoleDelegation,
    effectiveness: DelegationEffectivenessContext,
  ): DelegatedAuthorizationGrant | null {
    const decision = this.policies.evaluateEffectiveness(
      delegation,
      effectiveness,
    );

    if (!decision.effective) {
      return null;
    }

    const assignmentId = `delegation:${delegation.delegationId}`;
    const dataScope: DataScopeClaim = {
      assignmentId,
      type: delegation.scopeType,
      id: delegation.scopeId,
    };

    return {
      roleAssignment: {
        assignmentId,
        roleCode: delegation.roleCode,
        institutionId:
          delegation.scopeType === "Institution" ? delegation.scopeId : null,
        validFrom: delegation.startAt,
        validTo: delegation.endAt,
        delegationId: delegation.delegationId,
      },
      dataScope,
    };
  }
}
