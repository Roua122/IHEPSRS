# IAM-001 — User/account model

Owner: رؤى محمد  
Implementation: IMPLEMENT  
Prototype Priority: MUST

## Source mapping

- FR-001 — account lifecycle foundation
- FR-002 — model prerequisite only; authentication implementation belongs to IAM-005
- FR-003 — model prerequisite only; role/scope implementation belongs to IAM-002/IAM-003
- BR-040 — disabled accounts are not session-eligible
- BR-055 — Person is the identity root
- UC-01 — session eligibility prerequisite
- UC-19 — account lifecycle
- NFR-008 — no sensitive write route is exposed before authorization exists

## Canonical model

### Person

The implementation preserves these fields:

`personId`, `nationalIdentifier`, `fullNameAr`, `fullNameEn`, `birthDate`,
`email`, `mobile`, `status`.

At least one of `fullNameAr` / `fullNameEn` is required.

`nationalIdentifier` is never returned by the IAM-001 model preview endpoint.

### UserAccount

The implementation preserves:

`userId`, `personId`, `username`, `status`, `mfaRequired`, `lastLoginAt`.

The account must always reference a `personId`.

## Canonical status catalogue

```text
Invited
Active
Locked
Disabled
Archived
```

Implemented lifecycle operations use validated transitions rather than direct status assignment.

The IAM-001 domain permits:

```text
Invited -> Active
Active -> Locked
Locked -> Active
Active -> Disabled
Locked -> Disabled
Disabled -> Archived
```

The direct `Active -> Disabled` operation is required by the account-disable lifecycle
described by UC-19 / BR-040.

All other direct transitions are denied.

## BR-040 preparation

`UserAccount.canStartSession()` returns true only for `Active`.
IAM-005 must use this domain rule when it implements real session creation.

IAM-001 does not implement JWT, credentials, MFA challenge, logout or session storage.

## BR-055 boundary

Person remains the identity root. IAM-001 does not invent automatic identity matching
rules beyond the Baseline. National identifier encryption/HMAC matching and Data Steward
merge workflow require their persistence/governance implementation and must preserve
BR-055 exactly.

## HTTP surface

IAM-001 publishes only:

```text
GET /api/identity/account-model
```

This endpoint returns model metadata only. It does not return real persons/accounts and
does not expose credentials or sensitive identifiers.

## UI

A safe model preview is available at:

```text
/settings/users
```

It demonstrates:
- RTL UI,
- loading state,
- error state,
- canonical statuses,
- state transitions,
- Person identity-root concept,
- task boundaries.

Real account administration is connected only after IAM-003 and IAM-005 provide the
required authorization/authentication controls.
