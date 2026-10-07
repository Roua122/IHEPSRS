# ADR-014 — Research / Publication Corrective Prototype Boundary

- Status: Accepted for corrective prototype implementation
- Scope: `RS-001..RS-006`, `PUB-001..PUB-003`
- Does not change: Analysis Baseline business semantics

## Context

A post-merge review found that the first Research/Publications implementation compiled but did not consistently enforce the approved IAM boundary, canonical state models, identity/privacy rules, or source-linked verification. Some functionality also crossed into `PUB-005`, which belongs to another owner.

The corrective implementation must repair the prototype without inventing new role codes, business statuses, or ownership semantics.

## Decisions

### 1. Reuse IAM-003 authorization decisions after resource lookup

Research/Publications controllers are authenticated at the request boundary. Resource-aware institution/data scope is evaluated in domain services with the existing `AuthorizationDecisionService` after the relevant resource institution or Person scope is known.

This preserves the IAM-003 formula:

`Authenticated User + Role + Institution/Data Scope + Resource + Action + Record State`.

The corrective prototype uses only coded roles already present in the approved catalogue:

- `RA` — Research Authority;
- `RO` — Research Officer/Reviewer;
- `DS` — Data Steward for controlled identity resolution.

No code is invented for the uncoded `Researcher/Supervisor` actor row. Consequently, researcher self-service endpoints are not claimed by this correction until an approved mapping exists.

### 2. Actor identity comes from the authenticated principal

Sensitive approval/decision/steward identities are not trusted from request-body fields. The authenticated principal supplies the acting user/person identity. Business records may still retain source-approved actor references where required, but those references are derived/validated server-side.

### 3. Person matching is privacy-safe and fail-closed

The prototype does not put a raw national identifier in URLs or logs. Matching uses an opaque fingerprint representation for the national identifier. Email and birth date may be used only as a combined candidate signal in the prototype; birth date alone is not a trusted match.

Production encryption/HMAC key management remains deployment work and is not falsely claimed by this in-memory prototype.

### 4. Proposal and Project state changes use explicit business operations

The approved state models are implemented through operations, not arbitrary status patching. Project creation from an approved proposal is idempotent and produces one canonical project. Project leader/duration/reopen changes that require an amendment cannot silently overwrite state.

### 5. COI policy does not invent a recent-coauthorship duration

`BR-061` requires the period to come from `PolicyConfiguration`. If coauthorship evidence exists but the configured period is absent, the prototype fails closed rather than inventing a default duration.

### 6. Audit is hash-chained but prototype-only

Sensitive Research/Publications operations append to an in-memory, correlation-aware hash chain. This demonstrates tamper evidence for the academic prototype. It is not durable/WORM production audit storage and must not be represented as such.

### 7. Publication validation follows the approved state model

Supplying a DOI or ExternalPublicationId does not automatically mean `Validated`. Identifier-bearing records enter `SubmittedForValidation`; a separate validation operation moves them to `Validated`, and a failed validation returns them to `Draft` with a reason.

### 8. Preserve team ownership boundaries

`PUB-004` and `PUB-005` remain owned by their assigned task owner. `PUB-001..003` may store the canonical author fields required by their own source rules, but this correction does not expose an external-author-to-researcher linking workflow or claim the later tasks as completed.

### 9. Documentation-only tasks remain documentation-only

`RS-004` and `RS-005` are not reclassified as implemented CRUD features. Their source boundaries are documented in `docs/43_rs004_members_leader_boundary.md` and `docs/44_rs005_funding_boundary.md`.

## Consequences

- Existing endpoints may become stricter and reject requests that previously relied on spoofable actor identifiers or missing scope checks.
- Tests must include negative authorization, lifecycle, identity/privacy, COI, history, and canonical publication cases.
- Research and Publications verification scripts become CI gates.
- A later persistence phase must replace in-memory repositories/audit while retaining the same business semantics.
