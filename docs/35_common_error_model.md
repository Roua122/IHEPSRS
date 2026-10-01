# Common Error Model — TASK-FND-003

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

## Purpose
توحيد أخطاء Central API حتى لا يعرّف كل Domain شكل Error مختلفًا.

## Canonical Envelope

```json
{
  "timestamp": "2026-10-01T18:00:00.000Z",
  "path": "/api/example",
  "method": "POST",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "correlationId": "COR-123",
  "details": [
    {
      "field": "name",
      "constraints": ["name should not be empty"]
    }
  ]
}
```

## Standard Codes

| HTTP | Code |
|---:|---|
| 400 | `BAD_REQUEST` / `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 429 | `TOO_MANY_REQUESTS` |
| 500 | `INTERNAL_ERROR` |
| 503 | `SERVICE_UNAVAILABLE` |

## Correlation Boundary
FND-003 defines and carries `correlationId` if supplied.
FND-004 is responsible for generating, propagating and logging correlation ids across requests/integration flows.

## Security Boundary
Never return stack traces, SQL/database driver errors, tokens/passwords, filesystem paths, or raw unknown 500 exception text.

## Verification

```powershell
pnpm --filter @ihepsrs/api error-model:check
```

Expected:

```text
Common error model check passed.
```
