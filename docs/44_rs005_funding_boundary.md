# RS-005 — Funding Metadata / Amendments — Prototype Boundary

## Classification

- Task: `TASK-RS-005`
- Implementation: `DOCUMENTATION_ONLY`
- Owner: سمية خالد
- Source requirements: `FR-026`, `BR-023`, `BR-051`, `UC-11`, `NFR-014`

## Source-of-truth boundary

The IHEPSRS platform may keep research funding metadata as reference information, but it does **not** replace the financial system. Under `BR-023`, the finance system remains the official source of truth for actual financial movements, disbursements, balances, and accounting records.

Accordingly, this task does not introduce a prototype payment ledger, accounting engine, or authoritative grant-balance calculation.

## Canonical model retained for future implementation

The baseline `FundingRecord` concept remains authoritative. A future implementation may record source-approved funding metadata and versions, but must preserve these rules:

1. Financial values stored by IHEPSRS are reference metadata (`BR-023`).
2. A Budget/Funding change after approval is versioned rather than silently overwritten (`BR-051`).
3. The change requires an authorized approval before the new version is effective (`BR-051`).
4. Finance remains the source of truth for actual money movement even when integration is later added (`BR-023`, `BR-051`).
5. A multi-record funding/amendment operation must be atomic (`NFR-014`).

## Prototype boundary

The current academic prototype intentionally does **not** provide:

- FundingRecord CRUD endpoints;
- payment/disbursement processing;
- authoritative financial totals;
- budget amendment execution;
- reconciliation with a finance system;
- finance-system event ingestion.

The `initialBudget` value used by the proposal prototype is proposal metadata only. It must not be treated as an official financial balance or movement.

## Future integration rule

When finance integration is implemented, IHEPSRS must consume or reference authoritative financial data through the approved integration boundary. Direct database access to an external finance source is not permitted by the project architecture.

## Verification statement

For the current prototype, `RS-005` is satisfied only as `DOCUMENTATION_ONLY`. This document records the approved boundary and prevents the presence of reference budget metadata from being misrepresented as a financial implementation.
