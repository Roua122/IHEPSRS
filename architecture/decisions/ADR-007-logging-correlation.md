# ADR-007 — Structured Logging and Correlation IDs

Status: Accepted  
Date: 2026-10-01  
Related Task: TASK-FND-004

## Context
IHEPSRS needs traceable requests across:
- Central API calls,
- later integration messages,
- audit/diagnostic workflows,
- user-facing support.

Plain free-text logs make cross-request tracing difficult.

## Decision

### Correlation ID
- HTTP header: `x-correlation-id`.
- If a valid caller-provided value exists, preserve it.
- Otherwise generate a UUID.
- Return the value in every API response header.
- Include it in API error envelopes.
- Keep it in AsyncLocalStorage for request-scoped logging.
- Later integration tasks reuse the same concept for `correlationId` in integration envelopes.

### Logging
Use structured JSON log events.

Minimum request lifecycle events:
- `http.request.started`
- `http.request.completed`
- `http.request.failed`

Relevant fields:
- timestamp
- level
- event
- correlationId
- method
- path
- statusCode
- durationMs

### Security
Logs must not contain:
- passwords,
- access/refresh tokens,
- private keys,
- raw request bodies by default,
- full database connection strings.

## Consequences
Requests can be traced through logs and later linked to integration/audit records without introducing a full external observability platform into the prototype.
