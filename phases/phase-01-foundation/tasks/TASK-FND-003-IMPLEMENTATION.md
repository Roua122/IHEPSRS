# TASK-FND-003 — Implementation Checklist

Owner: رؤى محمد

## Branch
`feature/TASK-FND-003-common-error-model`

## Implemented
- [x] Canonical API error envelope.
- [x] Stable machine-readable error codes.
- [x] `AppException`.
- [x] Global exception filter.
- [x] Validation error normalization.
- [x] HTTP-status-to-error-code mapping.
- [x] Client-safe generic 500 response.
- [x] Optional correlation-id echo.
- [x] Runtime smoke checker.
- [x] ADR-006.
- [x] Developer documentation.

## Local verification
- [ ] `pnpm install`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm dev`
- [ ] `pnpm --filter @ihepsrs/api error-model:check`
- [ ] Verify no stack trace is exposed.
- [ ] PR review and merge.
