# IAM-005 QA

Run:

```bash
pnpm format
pnpm quality
pnpm --filter @ihepsrs/api iam001:check
pnpm --filter @ihepsrs/api iam002:check
pnpm --filter @ihepsrs/api iam003:check
pnpm --filter @ihepsrs/api iam004:check
pnpm --filter @ihepsrs/api iam005:check
pnpm test:smoke
```

Expected: all checks pass. Existing public health/config/reference endpoints remain reachable. Protected routes without explicit public/authenticated-only/policy metadata fail closed.
