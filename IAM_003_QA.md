# IAM-003 QA — Scope-aware Authorization

Task: TASK-IAM-003

## Expected automated checks

- `TC-FR-003-IAM003`: authorized role works only with required role/scope/action/state inputs.
- `TC-BR-027-IAM003 / UC-13`: University Admin scoped to institution A is denied institution B.
- `TC-BR-027-IAM003`: source-approved cross-institution coded role can satisfy cross-institution access from a central assignment.
- `TC-NFR-008-IAM003`: no principal, unknown role, or resource/action mismatch fails closed.
- `TC-FR-003-IAM003`: expired role assignment cannot authorize.
- `TC-FR-003-IAM003`: required data-scope and record-state restrictions are enforced.
- `TC-BR-035-IAM003`: report access is passed through the same scope engine.
- `TC-NFR-025-IAM003`: decision output does not echo principal/data-scope payloads.

## Boundary checks

- No authentication mock/backdoor endpoint added.
- No React page added.
- No new business permission catalogue invented.
- No delegation semantics claimed before IAM-004.
- No durable audit persistence claimed.
- Guard is not globally activated until IAM-005 supplies authenticated principals.
