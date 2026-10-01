# TASK-IAM-001 — Implementation Checklist

Owner: رؤى محمد

## Implemented

- [x] Person canonical model.
- [x] Person requires at least one Arabic/English canonical name.
- [x] UserAccount canonical model.
- [x] UserAccount requires `personId`.
- [x] Canonical UserStatus catalogue.
- [x] State changes through domain operation.
- [x] Unsupported direct state transitions denied.
- [x] Disabled account is not session-eligible.
- [x] No sensitive account-write HTTP endpoint before IAM authorization/authentication.
- [x] Safe account-model metadata endpoint.
- [x] RTL frontend model preview.
- [x] Loading/error/success UI states.
- [x] Source-ID-labelled executable checks.
- [x] ADR-009.
- [x] IAM-001 developer documentation.

## Explicitly deferred to owned tasks

- [ ] Role catalogue — IAM-002.
- [ ] Institution/data scope authorization — IAM-003.
- [ ] Delegation — IAM-004.
- [ ] Login/JWT/logout/session/MFA/lockout — IAM-005.
- [ ] Real user account administration UI — after IAM-003/IAM-005 authorization path exists.

## Verification

```powershell
pnpm install
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @ihepsrs/api iam001:check
```

Then run API + Web and open:

```text
http://localhost:5173/settings/users
```
