# IAM-004 — Delegation model

Owner: مرام وديع  
Prototype priority: SHOULD  
Sources: FR-044, BR-028, BR-058, UC-24, NFR-011, NFR-030, RoleDelegation data dictionary.

## Purpose

Provide the backend/core delegation model required for temporary, bounded and auditable role delegation without adding a frontend page or unauthenticated write API.

## Canonical RoleDelegation model

The implementation preserves the baseline fields exactly:

- delegationId
- delegatorUserId
- delegateUserId
- roleCode
- scopeType / scopeId
- startAt / endAt
- reason
- status: Pending / Active / Expired / Revoked

The constructor rejects unknown role codes, blank required fields, unknown statuses and `endAt <= startAt`.

## No privilege widening — BR-028

`DelegationPolicyService.validateCreation()` requires the delegator to have an active assignment with the same roleCode. The delegated scope must be covered by that source assignment:

- Institution scope must match the original institution assignment; or a cross-institution role may narrow a central assignment to a specific institution.
- Non-institution scopes require a matching IAM-003 data-scope claim associated with the source assignment.

This is deliberately fail-closed. IAM-004 does not create a new permission catalogue.

## Automatic end conditions — BR-058

`evaluateEffectiveness()` returns ineffective when any of the following occurs first:

- the delegation has not started or is not Active;
- `endAt` is reached;
- either account is disabled/inactive;
- the original role assignment is no longer active.

The service computes authorization effectiveness immediately. A future persistence layer may also materialize an `Expired` status, but request authorization must not depend on a background job having already updated a row.

## Integration with IAM-003

`DelegationAuthorizationService` converts an effective delegation into a bounded IAM-003 authorization grant. It carries:

- the delegated roleCode;
- the delegated institution/data scope;
- start/end as validity bounds;
- delegationId.

`AuthorizationDecisionService` now returns delegationId when the matched grant came from delegation. `ScopeAuthorizationGuard` emits a correlation-aware `security.authorization.delegated` structured event for successful delegated use.

## Source gap: UC-24 actions

UC-24 describes selecting `actions`, while the canonical RoleDelegation data dictionary has no actions field. IAM-004 therefore does not fabricate one. Existing IAM-003 policies still decide whether a resource/action is allowed for the delegated role and scope.

## Explicit boundaries

- No React/UI changes in IAM-004.
- No public delegation mutation endpoint before IAM-005 authentication and the persistence boundary.
- No durable AuditLog/WORM/hash-chain implementation is claimed; only propagation of delegationId and structured delegated-use logging is implemented here.
- Session timeouts/re-authentication remain IAM-005, while IAM-004 consumes the account-active condition required by BR-058/NFR-030.
