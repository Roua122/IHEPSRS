# ADR-011 — IAM-003 Scope Authorization Boundary

Status: Accepted for Academic Prototype
Task: TASK-IAM-003
Sources: Analysis Baseline Sections 14.1, 14.2; FR-003; BR-027; BR-035; UC-01; UC-13; UC-17; NFR-008; NFR-025

## Context

The Analysis Baseline defines the access decision as:

`Authenticated User + Role + Institution/Data Scope + Resource + Action + Record State`.

IAM-002 established the approved coded role catalogue and `RoleAssignment` shape. IAM-005 owns authentication/session establishment, while IAM-004 owns delegation. IAM-003 therefore needs a reusable authorization core without fabricating an authentication mechanism, delegation privilege, or undocumented permission catalogue.

## Decision

1. IAM-003 implements a pure, fail-closed `AuthorizationDecisionService` plus a NestJS `ScopeAuthorizationGuard` contract.
2. An authenticated request principal is an input contract. IAM-005 will populate it from the authenticated session/token; IAM-003 does not create mock authentication headers or a bypass identity.
3. Institution scope is evaluated from the approved `RoleAssignment.institutionId`. A matching institution is allowed. A central assignment may satisfy an institution-scoped policy only when the approved role catalogue explicitly describes that role as `Cross-Institution` or `Cross/Institution`.
4. Data scope is represented at runtime as opaque target `{type, id}` plus principal claims `{assignmentId, type, id}` bound to the role assignment that granted them. This prevents combining a role from one assignment with a data scope originating from another assignment. It is an authorization transport contract only; it does not add a new persistent business entity or redefine any domain data ownership.
5. Record state is explicitly part of each policy: either `ANY` or an approved set supplied by the domain policy. IAM-003 does not invent domain status values.
6. Role assignments are active from `validFrom` and cease authorizing at `validTo` when one exists. This is the technical interpretation of the existing validity interval and is not a new lifecycle status.
7. Missing policy, missing principal, unknown role, missing required scope, mismatched scope, mismatched resource/action, expired assignment, or disallowed record state all deny access.
8. The guard emits correlation-aware structured denial logs containing authorization metadata only. Durable/tamper-evident audit persistence remains a separate audit infrastructure concern and is not falsely claimed here.
9. IAM-003 does not register the guard globally yet. Doing so before IAM-005 would make the existing prototype endpoints unusable because no authenticated principal exists. IAM-005 is the integration point that supplies the principal and activates request-level enforcement on protected routes.

## Consequences

- The authorization core can be unit/integration tested before login/session implementation.
- No insecure development-only identity path is introduced.
- Domain modules can declare resource/action/state policies without duplicating scope logic.
- UC-17 delegation-specific privilege boundaries remain deferred to IAM-004.
- Full protected-route enforcement becomes complete only when IAM-005 connects authentication to this guard.
