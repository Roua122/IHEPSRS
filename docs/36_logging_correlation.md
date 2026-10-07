# Logging + Correlation — TASK-FND-004

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

## HTTP Behavior

Caller may send:

```http
x-correlation-id: COR-123
```

The Central API returns:

```http
x-correlation-id: COR-123
```

If the caller sends none, the API generates one automatically.

## Error Example

```json
{
  "timestamp": "2026-10-01T18:00:00.000Z",
  "path": "/api/missing",
  "method": "GET",
  "status": 404,
  "code": "NOT_FOUND",
  "message": "Cannot GET /api/missing",
  "correlationId": "generated-or-supplied-id"
}
```

## Structured Log Example

```json
{
  "timestamp": "2026-10-01T18:00:00.000Z",
  "level": "info",
  "event": "http.request.completed",
  "correlationId": "COR-123",
  "method": "GET",
  "path": "/api/health",
  "statusCode": 200,
  "durationMs": 4.18
}
```

## Important Boundary
This task establishes application-level request logging and correlation.
It does **not** claim production SIEM/APM deployment.

Later tasks may send these structured logs to a centralized logging platform.

## Verification

Keep API running, then:

```powershell
pnpm --filter @ihepsrs/api observability:check
```

Expected:

```text
Logging/correlation check passed.
```
