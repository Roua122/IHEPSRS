# TASK-IAM-002 — Implementation Checklist

Owner: رؤى محمد

## Implemented

- [x] Section 4.3 explicit role-code catalogue.
- [x] Exact coded roles: CGA, IRS, UA, PGA, PGO, RA, RO, DS, IO, SA, RC.
- [x] Baseline scope descriptor preserved for every coded role.
- [x] Three uncoded Section 4.3 rows preserved without invented identifiers.
- [x] RoleAssignment canonical reference model.
- [x] Unknown `roleCode` rejected (fail closed).
- [x] Read-only role-catalogue metadata endpoint.
- [x] RTL role-catalogue preview page.
- [x] Loading/error/success/empty UI handling.
- [x] Source-ID-labelled executable checks.
- [x] ADR-010 source-fidelity decision.
- [x] IAM-002 developer documentation.

## Explicitly deferred to owned tasks

- [ ] Resource/action/institution/data-scope authorization — IAM-003.
- [ ] RoleDelegation lifecycle and non-widening enforcement — IAM-004.
- [ ] Login/session/MFA — IAM-005.
- [ ] Real role-assignment write UI/API — after IAM-003/IAM-005.
- [ ] Audit persistence/tamper-evidence for privilege mutations — security/audit implementation path.
- [ ] Approved roleCode mapping for the three currently uncoded Section 4.3 rows.

## Verification

```powershell
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @ihepsrs/api iam001:check
pnpm --filter @ihepsrs/api iam002:check
```

Then run API + Web and open:

```text
http://localhost:5173/settings/roles
```
