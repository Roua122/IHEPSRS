# ADR-017 — TH005 institutional defense eligibility prototype boundary

Status: **PROPOSED — requires academic authority review**
Date: 2026-10-11
Owner: دعاء عبد الواحد (TH005), security verification: رؤى محمد (HRD001)

## Context
FR-018/BR-016 requires valid, conflict-free committee membership. The previous
`UnavailableDefenseEligibilityGateway` correctly denied all proposals outside
the focused tests; however, the prototype's real API could not demonstrate a
positive approved-committee and defense-scheduling path. The full external
HR/COI/Examiners registry and document service are not yet integrated.

## Decision
For **internal examiners only**, use the canonical Researcher/Person registry
and existing Research COI evidence, with an explicit attestation signed by an
authenticated, institution/program-scoped Postgraduate Authority (PGA). Store
the attestation as append-only process-local evidence, bound to Thesis,
institution, program, member Person and role. A positive attestation never
bypasses a known canonical conflict. A later conflict declaration is retained
as a negative record and immediately supersedes an earlier positive record.
Re-check all evidence at proposal, approval and scheduling boundaries. Audit
member attestation and sensitive committee/session/correction reads.

No request-body `approvedByUserId`, `eligible=true`, or self-declared server
trust is accepted. Other institutions, unregistered researchers and external
examiners are denied until a **trusted** provider is implemented. This does not
change BR-015/016, the defined committee state machine, or assign degree-award
authority to TH008.

## Consequences and release gates
- Enables positive **prototype** committee cases without mock-only bypass in
  the actual Thesis module, with no claim of an independent HR certificate.
- Adds an explicit PGA attestation route with institution/program scope and
  server-bound actor identity.
- Does **not** satisfy real examiner credentials, storage durability, signed
  legal decisions, durable audit retention, WORM or production COI attestation.
- The academic owner must review this decision for prototype use; external
  examiner support needs a subsequent approved adapter/ADR, not loosening the
  gateway or accepting browser-provided booleans.
- Production sign-off requires replacement of process-local state with a
  transactional persistent store and verified upstream service evidence.

## Verification
`pnpm --filter @ihepsrs/api thesis-defense:check` runs the 35 original defense
cases plus 23 institutional eligibility / security regression cases. The
separate security workflow adds dependency advisory checks and CodeQL SAST,
but passing remote scans must be recorded before acceptance.
