# TASK-FND-004 — Implementation Checklist

Owner: رؤى محمد

## Branch
`feature/TASK-FND-004-logging-correlation`

## Implemented
- [x] Caller correlation-id preservation.
- [x] Automatic UUID generation.
- [x] Response `x-correlation-id` header.
- [x] Correlation id in error envelope.
- [x] Request-scoped AsyncLocalStorage context.
- [x] Structured JSON request-start logs.
- [x] Structured JSON request-completion logs.
- [x] Structured failure logs.
- [x] Request duration.
- [x] CORS exposure for correlation header.
- [x] Runtime smoke checker.
- [x] ADR-007.
- [x] Developer documentation.

## Local verification
- [ ] `pnpm install`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] API starts.
- [ ] `pnpm --filter @ihepsrs/api observability:check`
- [ ] Verify logs contain correlationId.
- [ ] Verify logs do not contain secrets.
- [ ] PR review and merge.
