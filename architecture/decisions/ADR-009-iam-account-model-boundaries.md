# ADR-009 — IAM-001 Account Model Boundaries

Status: Accepted  
Date: 2026-10-01  
Related Task: TASK-IAM-001

## Context

TASK-IAM-001 references account lifecycle, authentication and RBAC requirements,
while later IAM tasks explicitly own:

- IAM-002: Role catalogue
- IAM-003: Scope-aware authorization
- IAM-004: Delegation model
- IAM-005: Authentication/session security

Publishing sensitive account-write HTTP endpoints before IAM-003/IAM-005 would create
an authorization bypass or require a temporary authentication mechanism not present in
the Analysis Baseline.

## Decision

IAM-001 implements:

- canonical `Person` shape and validation,
- canonical `UserAccount` shape,
- canonical `UserStatus`,
- domain-controlled status transitions,
- session-eligibility predicate needed later by BR-040,
- safe read-only metadata endpoint for the model,
- UI preview of the model.

IAM-001 deliberately does **not** publish sensitive account write endpoints.

The later IAM tasks wire the domain model to:
- role permissions,
- institution/data scope,
- delegation,
- real authentication/session controls.

## Persistence

No new persistence technology is introduced by this task.
The domain model is persistence-agnostic so the approved project persistence adapter
can be attached without changing business semantics.

## Security consequence

The task adds no unauthenticated path capable of creating, activating, disabling,
locking, archiving, or reading real user accounts.
