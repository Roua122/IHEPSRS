# IAM-003 — Scope-aware Authorization

Task: `TASK-IAM-003`
Implementation: Backend/Core only
Prototype Priority: MUST

## Source baseline

IAM-003 implements the authorization decision defined in Analysis Baseline Section 14:

`Access Decision = Authenticated User + Role + Institution/Data Scope + Resource + Action + Record State.`

Relevant source IDs: `FR-003`, `FR-037`, `BR-027`, `BR-035`, `UC-01`, `UC-13`, `UC-17`, `NFR-008`, `NFR-025`.

## Implemented core

The backend now contains:

- `AuthorizationDecisionService`: pure fail-closed access-decision engine.
- `AuthorizationPolicy`: explicit Resource + Action + allowed role codes + institution/data-scope requirements + record-state rule.
- `AuthorizationPrincipal`: authenticated-user contract containing active role assignments and optional runtime data-scope claims.
- `ScopeAuthorizationGuard`: NestJS guard contract that enforces an attached policy and writes structured denial logs with correlation support.
- `RequireAuthorization`: metadata decorator for future protected controllers.

No new React page is added in IAM-003.

## Scope behavior

Institution scope uses `RoleAssignment.institutionId`. A university-scoped assignment cannot authorize access to another institution. A central assignment can cross institution boundaries only for a coded role whose approved IAM-002 catalogue scope explicitly says `Cross-Institution` or `Cross/Institution`.

Data scope is intentionally generic and runtime-only. Requests identify an opaque target `{type, id}` while principal claims use `{assignmentId, type, id}` and are bound to the role assignment that grants the scope. These are not a new database entity; they are the adapter boundary through which later domain modules/delegation resolution can supply the exact authorized data subset without mixing privileges across assignments.

Record state is never guessed by IAM-003. A domain policy must explicitly choose `ANY` or provide its allowed state values.

## Deny-by-default cases

IAM-003 denies when there is no authenticated principal, no matching approved role, an inactive/expired assignment, a resource/action policy mismatch, missing required institution/data scope, a scope mismatch, or an invalid record-state condition. Unknown role codes never become implicit privileges.

## Integration boundary with IAM-004 and IAM-005

IAM-004 owns temporary delegation and may later contribute bounded scope claims/assignments to the principal. IAM-005 owns login/session security and is responsible for creating the authenticated request principal and activating the guard on protected HTTP routes.

IAM-003 deliberately does not add an insecure query/header-based mock user because that would undermine `NFR-008`.

## Audit and privacy

Authorization denials emitted by `ScopeAuthorizationGuard` use the existing structured logger/correlation context. Logs contain policy/resource/action/reason/role codes and may contain the internal user identifier. They do not echo data-scope IDs, personal profile fields, credentials, or sensitive identity evidence.

`FR-037` durable audit storage/tamper-evidence is not claimed by this task; that remains dependent on the audit persistence implementation.

## Verification

Run:

```powershell
pnpm --filter @ihepsrs/api iam003:check
```

The check covers source-linked cases for RBAC, cross-institution isolation, report-scope parity, deny-by-default, data-scope/state participation, assignment validity, and privacy-minimized decision output.
