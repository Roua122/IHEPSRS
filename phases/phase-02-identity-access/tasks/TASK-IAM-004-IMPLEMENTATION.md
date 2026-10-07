# TASK-IAM-004 — Delegation model — Implementation

Status: IMPLEMENTED CORE (pending PR/merge)  
Owner: مرام وديع  
Priority: SHOULD

## Sources

- FR-044 — Temporary delegation management
- BR-028 — bounded duration/scope/reason; no privilege widening
- BR-058 — end at endAt/account disable/original-role revocation; retain delegationId on sensitive use
- UC-24 — temporary delegation workflow
- NFR-011 — audit trace requirements
- NFR-030 — account/session invalidation dependency

## Implemented

- Canonical RoleDelegation domain model and status catalogue.
- Fail-closed delegation creation validator tied to existing role assignments and IAM-003 scopes.
- Runtime effectiveness check for start/end, account activity and original-role activity.
- Adapter from effective delegation to IAM-003 authorization grant.
- delegationId propagation through authorization decisions.
- Correlation-aware structured delegated-use security log.
- Source-linked IAM-004 verification and CI step.

## Deferred by boundary

- Persistent RoleDelegation repository and mutation API.
- Authenticated administration UI/API; IAM-005 must establish request identity first.
- Durable tamper-evident audit storage.
- Any persistent action-subset field not present in the canonical RoleDelegation dictionary.
