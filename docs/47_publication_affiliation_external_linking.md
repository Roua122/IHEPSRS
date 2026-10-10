# Publication affiliation snapshots and external-author linking — PUB-004 / PUB-005

This document records the prototype implementation for TASK-PUB-004 and TASK-PUB-005 without changing the publication semantics already established by PUB-001 through PUB-003.

## PUB-004 — Affiliations at publication time
- Researcher/Person affiliation history is represented as effective-dated `AffiliationHistoryRecord` data with `personId`, institution, optional org unit, optional role/rank, effective dates, and source system.
- When an internal publication author supplies `affiliationOrgUnitId` and a publication date, the prototype verifies that the researcher's affiliation covers that date.
- PublicationAuthor keeps the affiliation snapshot stored on the publication author record. A later affiliation change does not rewrite an older publication's author affiliation.
- The implementation continues to require either `affiliationOrgUnitId` or `affiliationText` per BR-048.

## PUB-005 — External author linking
- An existing external PublicationAuthor can be linked later to an existing Researcher.
- Linking updates the author identity link (`researcherId`/`linkedAt`) without creating a second Publication and without changing `authorOrder` or the stored affiliation snapshot.
- Silent re-linking from one Researcher to another is rejected; identity correction remains governed by the Person/identity-resolution rules rather than by arbitrary publication updates.
- The operation is authorization-scoped, audited, and rolled back as one prototype transaction if a later write/audit step fails, providing NFR-014 evidence.

## Identity and privacy boundary
The link targets the existing Researcher/Person identity model and does not create a new Person root. Sensitive identity matching remains owned by the controlled identity-resolution behavior. The publication operation does not expose national identifiers or add them to logs.

## Verification
`apps/api/scripts/check-publications.cjs` verifies PUB-001 through PUB-005 together, including affiliation-at-publication-date behavior, preservation of historical snapshots, external-author linking without duplicate Publication creation, prevention of silent relink, and atomic rollback.
