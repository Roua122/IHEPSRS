# ADR-005 — Configuration Strategy

Status: Accepted  
Date: 2026-10-01  
Related Task: TASK-FND-002

## Context
IHEPSRS needs two different kinds of configuration:

1. **Runtime/deployment configuration**
   - ports
   - database connection
   - environment
   - CORS
   - credentials/secrets

2. **Business/policy configuration**
   - rules whose values may change over time
   - must remain versioned/effective-dated
   - historical decisions must retain the policy version used at decision time

Mixing both kinds would risk leaking secrets or silently rewriting historical meaning.

## Decision

### Runtime configuration
- Loaded from environment variables.
- Validated at application startup.
- Real `.env` is never committed.
- Secrets are never exposed by status endpoints.
- Production secrets must come from an external secret mechanism/KMS-equivalent, not business tables.

### Business policy configuration — Prototype
- Stored as a separate JSON document selected by `POLICY_CONFIG_PATH`.
- Every policy has:
  - `policyVersion`
  - `effectiveFrom`
  - optional `effectiveTo`
  - `values`
- Old policy versions are immutable.
- New policy changes add a new effective-dated version.
- Callers receive `policyVersion` with each value and must persist it with a decision when the business rule requires historical reproducibility.

### Integration contracts
- Contract version remains separate from policy version.
- `INTEGRATION_CONTRACT_VERSION` is explicit in runtime configuration.
- Breaking contract changes require a new major contract version.

## Consequences
This separates deployment concerns, secrets, business policy history and API contract versioning without changing Analysis semantics.
