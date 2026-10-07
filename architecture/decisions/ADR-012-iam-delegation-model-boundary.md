# ADR-012 — IAM delegation model boundary

Status: Accepted for TASK-IAM-004 prototype implementation

## Context

TASK-IAM-004 is sourced from FR-044, BR-028, BR-058, UC-24, NFR-011 and NFR-030. The canonical `RoleDelegation` dictionary contains delegationId, delegator/delegate, roleCode, scopeType/scopeId, startAt/endAt, reason and status. UC-24 also describes choosing actions during delegation creation, but the canonical dictionary does not define a persistent actions field.

IAM-003 already owns the authorization policy decision for resource + action + role + institution/data scope + record state. IAM-005 will later supply authenticated request principals and session enforcement.

## Decision

1. `RoleDelegation` is implemented as a domain model using only the canonical dictionary fields and status values `Pending/Active/Expired/Revoked`.
2. Creation validation is fail-closed: the delegator must currently hold the same approved roleCode and the delegated scope must be covered by the source role assignment/data-scope claim. This prevents a delegation from widening the delegator's authority.
3. An active delegation is effective only inside its start/end window while both accounts are active and the original role assignment remains active. Reaching `endAt`, disabling either account, or losing the original role makes the delegation ineffective immediately.
4. IAM-004 does not invent a persistent `actions` field. Resource/action restrictions remain governed by IAM-003 authorization policies. If the analysis baseline later adds a canonical action subset to RoleDelegation, that change requires a controlled baseline/change decision.
5. Effective delegated grants carry `delegationId` into the IAM-003 authorization decision. The guard emits a structured delegated-use security event when such a grant authorizes a request. Durable tamper-evident/WORM audit persistence remains an audit/persistence concern and is not falsely claimed here.
6. No unauthenticated delegation write endpoint is published. Persistence and authenticated administration are deferred until those boundaries exist.

## Consequences

- BR-028 can be tested without inventing permissions or role codes.
- BR-058 termination conditions are fail-closed and testable independently of persistence.
- IAM-003 remains the single authorization evaluator instead of adding a parallel delegation authorization engine.
- IAM-005 can later construct authenticated principals containing direct and delegated grants.
