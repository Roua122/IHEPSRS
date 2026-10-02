# IAM-004 QA

Run:

```powershell
pnpm quality
pnpm --filter @ihepsrs/api iam001:check
pnpm --filter @ihepsrs/api iam002:check
pnpm --filter @ihepsrs/api iam003:check
pnpm --filter @ihepsrs/api iam004:check
```

Expected IAM-004 coverage:

- FR-044: canonical delegation fields, time bounds and authorization grant.
- BR-028 / UC-24: no role/scope widening; unknown roles fail closed.
- BR-058: endAt, account-disabled and original-role-revoked conditions terminate effective delegation.
- NFR-011: delegationId reaches authorization decisions and delegated-use structured logs; durable audit persistence is explicitly not claimed.
- NFR-030: account-active dependency prevents a disabled party's delegation from remaining effective.

Frontend changes expected: none.
