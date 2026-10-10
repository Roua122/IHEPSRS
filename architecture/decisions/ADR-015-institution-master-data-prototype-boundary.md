# ADR-015 — Institution master-data prototype boundary

## Status
Accepted for the academic prototype implementation of TASK-INS-001 through TASK-INS-004.

## Context
The institution domain must implement the canonical Institution, OrgUnit, AcademicProgram, reference-data, and PolicyConfiguration behaviors required by FR-004/005/006/007/038/043 and BR-001/002/003/033/038/039/042/062 without introducing a second authorization model or rewriting historical data.

The prototype currently uses in-memory domain stores. Durable PostgreSQL/Prisma persistence is a later implementation concern and must not be falsely represented as production durability.

## Decision
1. Institution-domain authorization is evaluated through the existing IAM-003 `AuthorizationDecisionService`. Central registry/reference operations are limited to the approved central registry roles; institution/program operations additionally evaluate institution scope.
2. Institution, OrgUnit, AcademicProgram, reference values, and PolicyConfiguration use canonical source fields and effective-dated/versioned records. New versions do not overwrite the historical version that governed an earlier event.
3. The prototype maintains an in-memory transaction snapshot and rolls back both domain state and the prototype audit chain when a multi-step write fails. This demonstrates NFR-014 behavior for the academic prototype; it is not a substitute for a database transaction in production.
4. Sensitive master-data writes append correlation-aware entries to a shared prototype audit hash chain. This is evidence for the prototype and is not claimed to be a production WORM/audit platform.
5. `NFR-007` is bounded here to master-data configurability (`externalRefs`, institution-scoped configuration, versioned policies). Adapter credentials and source-system connectivity remain owned by the Integration domain; this task does not invent or store integration credentials.
6. Cohort-scoped PolicyConfiguration remains a canonical supported scope. Because the institution domain does not own a cohort-to-institution resolver, central authorization is required for cohort policy writes in this prototype rather than inventing an undocumented mapping.

## Consequences
- The domain remains fail-closed and reuses IAM instead of duplicating role logic.
- Historical program/reference/policy decisions can resolve the version effective at the event date.
- A future persistence implementation can replace the in-memory repositories while preserving the service contracts and source rules.
- Production release still requires durable database transactions, durable audit retention, and deployment-grade integration credential management.
