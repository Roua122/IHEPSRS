# ADR-006 — Common API Error Model

Status: Accepted  
Date: 2026-10-01  
Related Task: TASK-FND-003

## Context
All IHEPSRS API modules need predictable failure responses for:
- frontend handling,
- integration clients,
- support/diagnostics,
- security,
- later observability.

## Decision
All unhandled HTTP failures pass through one global exception filter.

Canonical client error envelope:

```json
{
  "timestamp": "ISO-8601 UTC",
  "path": "/api/resource",
  "method": "GET",
  "status": 404,
  "code": "NOT_FOUND",
  "message": "Cannot GET /api/resource",
  "correlationId": "optional-until-FND-004",
  "details": {}
}
```

### Rules
- `code` is machine-readable and stable.
- `message` is safe for clients.
- `details` is optional and structured.
- stack traces are never returned to the client.
- unknown server exceptions become `INTERNAL_ERROR`.
- validation failures use `VALIDATION_ERROR`.
- HTTP status remains semantically correct.
- correlation id is consumed when supplied; full generation/propagation/logging is completed by FND-004.

## Security
Internal exception details, filesystem paths, stack traces, database messages and secrets must not appear in API responses.
