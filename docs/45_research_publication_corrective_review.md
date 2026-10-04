# Corrective Review — Research and Publications

## Purpose

This note records the corrective review applied after the initial merge of Sumaya's Research/Publications work. It is an implementation-quality correction, not a change to the approved Analysis Baseline.

## Tasks covered

- Research: `RS-001` through `RS-006`
- Publications: `PUB-001` through `PUB-003`
- Explicitly excluded ownership: `PUB-004`, `PUB-005`

## Corrected areas

### Research identity (`RS-001`)

- controlled DS authorization for identity search/merge/unmerge;
- no raw national identifier in URL/logs;
- masked identifier exposure;
- stronger candidate matching boundary;
- controlled merge with restoration snapshot and unmerge;
- verified ORCID uniqueness.

### Proposal workflow (`RS-002`)

- explicit Draft/Submitted/Screening/UnderReview/RevisionRequested/decision operations;
- mandatory manual COI disclosure before reviewer assignment;
- COI checks for the source-approved evidence categories;
- assigned-reviewer identity check;
- RA-only decision with institution scope;
- proposer cannot issue own decision;
- approval creates one idempotent project.

### Project lifecycle / amendments / outputs (`RS-003`, `RS-006`)

- explicit state-transition operation instead of arbitrary status patching;
- project period requirement before activation;
- canonical AmendmentRequest statuses and RA decision boundary;
- post-activation change history preserved via amendment flow;
- output starts as Submitted and requires an explicit acceptance operation;
- completion checks required output state.

### Documentation-only boundaries (`RS-004`, `RS-005`)

- `RS-004` is documented in `docs/43_rs004_members_leader_boundary.md`;
- `RS-005` is documented in `docs/44_rs005_funding_boundary.md`;
- neither is falsely represented as a complete CRUD/finance subsystem.

### Publications (`PUB-001..003`)

- at least one internal Researcher is required for a new canonical Publication (`BR-024`);
- author order must be the exact integer sequence `1..N`;
- affiliation presence is retained as required by the publication-author rule;
- DOI/ExternalPublicationId canonical uniqueness is enforced;
- identifier presence no longer auto-validates a publication;
- publication state operations follow the approved state model;
- external-author linking endpoint was removed from this ownership scope so `PUB-005` remains separate.

## Authorization model

No new role code was introduced. Institution-scoped research/publication operations use the approved coded `RA`/`RO` roles. Research decisions use `RA`. Controlled Person identity resolution uses `DS` with Person data scope where a concrete Person target is known.

The uncoded `Researcher/Supervisor` actor row is not converted into a fabricated role code.

## Verification gates

The corrective branch must pass:

```text
pnpm quality
pnpm --filter @ihepsrs/api iam001:check
pnpm --filter @ihepsrs/api iam002:check
pnpm --filter @ihepsrs/api iam003:check
pnpm --filter @ihepsrs/api iam004:check
pnpm --filter @ihepsrs/api iam005:check
pnpm --filter @ihepsrs/api research:check
pnpm --filter @ihepsrs/api publications:check
pnpm test:smoke
```

Research/Publications checks are also added to CI so later changes cannot silently break these source-linked rules.
