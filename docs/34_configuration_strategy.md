# Configuration Strategy — TASK-FND-002

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

## Requirement Mapping

- `FR-038`: operational/business settings can change without editing application code.
- `BR-038`: a later configuration change must not retroactively change the meaning of an earlier decision.
- `BR-062`: regulatory/business settings are versioned and effective-dated; existing records retain the applied `policyVersion`.
- `NFR-010`: secrets are not stored in business configuration and are not committed to source control.
- `NFR-016`: configuration boundaries remain explicit and maintainable.
- `NFR-024`: integration contract versions are explicit and separate from policy versions.

## Prototype Design

### Runtime configuration
Environment variables are for deployment/runtime concerns:

```text
NODE_ENV
APP_VERSION
API_PORT
CORS_ORIGIN
DATABASE_URL
LOG_LEVEL
INTEGRATION_CONTRACT_VERSION
POLICY_CONFIG_PATH
```

### Business policy configuration
Prototype policy values are loaded from:

```text
apps/api/config/policies.json
```

The initial file intentionally contains an empty `values` object.
This proves version/effective-date mechanics without inventing new business values that are not defined by the Analysis.

When a later domain task needs a configurable policy:
1. use an Analysis-defined policy key/value,
2. add a **new policy version** when the value changes,
3. do not edit historical versions,
4. persist `policyVersion` on the business decision/record where required.

## Security Rule
`GET /api/config/status` may expose only safe metadata:
- environment name
- application version
- integration contract version
- effective policy version

It must never return:
- `DATABASE_URL`
- passwords
- tokens
- client secrets
- private keys

## Verification

```powershell
pnpm config:check
pnpm typecheck
pnpm build
pnpm dev
```

Then:

```text
GET http://localhost:3000/api/config/status
```

Expected shape:

```json
{
  "environment": "development",
  "appVersion": "0.1.2",
  "integrationContractVersion": "1.0",
  "policyVersion": "2026.1",
  "secretsExposed": false
}
```
