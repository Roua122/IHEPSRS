# RS-004 — Members / Leader Changes — Prototype Boundary

## Classification

- Task: `TASK-RS-004`
- Implementation: `DOCUMENTATION_ONLY`
- Owner: سمية خالد
- Source requirements: `FR-025`, `BR-020`, `BR-050`, `UC-11`, `NFR-011`

## What this task means in the academic prototype

`RS-004` does **not** introduce a full ProjectMember administration subsystem in the prototype. The canonical analysis remains the source of truth for the `ProjectMember` entity and for future member-role history. This document records the boundary so that the task is not falsely represented as an implemented CRUD module.

The prototype keeps the following source-approved semantics:

1. An approved research project must have a responsible leader and a defined project period (`BR-020`).
2. A leader change after project activation is not a direct field overwrite. It is represented by an `AmendmentRequest`, reviewed/decided by the Research Authority (RA), and applied only after approval (`BR-050`).
3. The previous state is preserved through the amendment/audit trail rather than silently overwritten (`BR-050`, `NFR-011`).
4. General ProjectMember CRUD, role-history management, and affiliation-history management remain outside the current prototype implementation unless a later task or approved change request explicitly brings them into scope.

## Prototype implementation touchpoint

`RS-003` implements the minimal leader-change business operation required by `BR-050` because the project lifecycle itself must reject direct post-activation leader mutation. The implementation uses an `AmendmentRequest` flow and does not claim to implement the broader `FR-025` member-management feature.

This is intentionally a boundary reuse, not reassignment of `RS-004` ownership.

## Authorization and history

A leader-change amendment is a sensitive operation. The corrective prototype requires:

- authenticated request identity;
- RA institution-scoped authorization for amendment decisions;
- no actor identity accepted from an untrusted request body;
- correlation-aware audit entry for amendment request, decision, and application;
- preservation of the prior project state in the amendment/audit history.

## Explicitly not implemented by RS-004

The following remain documentation/future work for this task classification:

- standalone `ProjectMember` create/update/delete endpoints;
- historical member-role timelines;
- automatic HR synchronization of project-member affiliations;
- UI for member administration;
- production persistence and WORM audit infrastructure.

## Verification statement

For the current prototype, `RS-004` is considered satisfied only as `DOCUMENTATION_ONLY`: the canonical member/leader semantics are preserved, the implemented project lifecycle does not bypass `BR-050`, and no new business semantics are introduced here.
