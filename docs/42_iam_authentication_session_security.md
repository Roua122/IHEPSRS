# IAM-005 — Authentication and Session Security

Sources: FR-002, BR-040, UC-01, UC-19, NFR-008, NFR-009, NFR-030, NFR-031, Prototype Acceptance Gate.

## Implemented
- Local fallback login only when trusted SSO is unavailable.
- Password >=12 and prototype common/breached screening hook.
- TOTP MFA required for the local fallback path.
- Five failed attempts within 15 minutes cause a 15-minute temporary lock.
- Opaque bearer sessions, logout/revocation, per-user revocation API in the service layer.
- Sensitive/Admin session limits: idle 15 minutes, max 8 hours.
- Regular session limits: idle 30 minutes, max 12 hours.
- Explicit re-authentication support for sensitive policies.
- Request principal hydration and global fail-closed route security boundary.
- Minimal `/login` UI only, per the revised Backend/Core-first plan.

## Runtime endpoints
- `POST /api/auth/login` — public login endpoint.
- `GET /api/auth/session` — authenticated-only session description.
- `POST /api/auth/reauthenticate` — password + MFA re-authentication.
- `POST /api/auth/logout` — revokes the current session.

## Prototype local configuration
The local fallback is disabled by default. Put real demo credentials only in local `.env`, never in Git. The demo requires username, password, Base32 TOTP secret, user/person IDs, an approved IAM-002 role code, optional institution scope, and a session profile.

## Boundaries
- Enterprise IdP/SSO integration remains deployment/integration work.
- Session persistence is in-memory for the academic prototype and is not HA.
- The prototype common/breached password denylist demonstrates the screening mechanism but is not a production breach corpus.
- IAM-004 delegation persistence is still deferred; IAM-005 does not fabricate a delegation repository.
