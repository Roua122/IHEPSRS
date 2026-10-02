# ADR-013 — IAM-005 authentication/session prototype boundary

Status: Accepted for Academic Prototype

## Context
FR-002 and UC-01 require login/logout/session management and MFA. NFR-030 defines session limits. NFR-031 allows local/break-glass authentication only when trusted SSO is unavailable and requires MFA, password screening and temporary lockout.

The prototype does not yet have an enterprise IdP or durable identity/session persistence.

## Decision
1. IAM-005 uses an **opaque bearer session token** held in an in-memory prototype session store. Only a SHA-256 token digest is stored server-side; the raw token is returned once to the client.
2. The local authentication path is disabled by default and is available only when `PROTOTYPE_LOCAL_AUTH_ENABLED=true` and `TRUSTED_SSO_AVAILABLE=false`.
3. Local fallback always requires TOTP MFA. No real password or TOTP secret is committed to Git.
4. Session security profiles implement the exact NFR-030 limits: Sensitive/Admin = idle 15m/max 8h; Regular = idle 30m/max 12h.
5. Sensitive policies may set `requiresReauthentication=true`. IAM-005 arms a one-use re-authentication marker after password+MFA verification rather than inventing an undocumented freshness duration.
6. Global request guards are activated: explicitly public routes bypass authentication; authenticated-only self-session routes require a valid session; all other routes continue through IAM-003 policy authorization and deny by default when policy metadata is missing.
7. The prototype password screen includes a small local common/breached sample denylist to demonstrate the NFR-031 mechanism. Production must use a maintained breach/common-password corpus or provider.

## Consequences
- Prototype login can be demonstrated without fabricating a trusted SSO integration.
- Session state is not HA/durable and is intentionally not claimed as production-ready.
- The bearer token is stored in browser `sessionStorage` only for the academic prototype. Production browser token/cookie design requires deployment security review.
