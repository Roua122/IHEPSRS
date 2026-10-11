# ADR-PG-003 — Conditional postgraduate admission without a new application status

Status: **PROPOSED — team review required before final acceptance**
Task: `TASK-PG-003`
Source: Baseline v3, `FR-011`, `FR-012`, `BR-007`, `BR-008`, `BR-041`, `UC-05`, section 11.

## Context

`FR-012` permits `Accepted`, `Rejected` and conditional acceptance. The
`PostgraduateApplication` status model in the Baseline includes `UnderReview`,
`Accepted` and `Rejected` but **does not** define a separate
`ConditionalAccepted` *application status*. The existing project record has
`AdmissionDecision.outcome = ConditionalAccepted` and
`AdmissionDecision.conditionsClearedAt`. `BR-008` prohibits admission/enrollment
without a valid acceptance and checks at enrollment time.

## Proposed technical treatment

- The officer's review and the postgraduate authority's decision are separate
  actions. Only an authorized `PGA` signs a final decision.
- Conditional acceptance is recorded as an `AdmissionDecision` with its
  original `decisionId`, `outcome`, `reason`, `conditions`, `decidedAt`, and
  effective `policyVersionId`. While conditions remain open the application
  stays in the **existing** `UnderReview` state, blocking normal enrollment.
- After verifying evidence, an authorized `PGA` records `conditionsClearedAt`,
  an immutable clearance review entry, and transitions the application to
  the existing `Accepted` state. The original conditional decision is retained.
- The enrollment task (`PG004`) must require `status === 'Accepted'` and either
  `decision.outcome === 'Accepted'` or
  `decision.outcome === 'ConditionalAccepted' && conditionsClearedAt`.
- No new business status and no automatic enrollment are created here.

## Consequences / coordination

- The condition-clearance endpoint is not proof of regulatory eligibility by
  itself; the authorized approver must verify the evidence. An approved policy
  for conditions may require integration with PolicyConfiguration or Documents.
- This representation requires confirmation by the project owner. If the
  baseline owner specifies another meaning for conditional acceptance, adjust
  this technical approach without silently changing business rules.
- Persistence/transactional outbox (`NFR-014`), cross-user reviewer validation,
  Document Gateway, and real notification delivery remain external dependencies
  in the uploaded PG002/PG003 snapshot, not completed by this ADR.
