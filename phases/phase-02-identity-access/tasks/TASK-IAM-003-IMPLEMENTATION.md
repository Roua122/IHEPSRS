# TASK-IAM-003 — Implementation Record

Status: IMPLEMENTED IN BRANCH
Owner: رؤى محمد
Prototype Priority: MUST

## What changed

Implemented the backend/core authorization layer defined by the Analysis Baseline:

- role-aware authorization against IAM-002 role assignments;
- institution scope enforcement;
- optional opaque data-scope claim matching;
- resource + action policy matching;
- record-state policy support;
- role-assignment validity-window enforcement;
- deny-by-default decisions;
- reusable NestJS authorization decorator/guard contract;
- correlation-aware authorization denial logging;
- source-linked IAM-003 verification script and CI step.

## Intentionally not implemented here

- authentication/token/session creation: `TASK-IAM-005`;
- temporary delegation expansion/revocation rules: `TASK-IAM-004`;
- global guard activation before authenticated principals exist;
- new frontend pages;
- durable/tamper-evident AuditLog persistence;
- fabricated permission codes or domain record states.

## Source IDs

`FR-003`, `FR-037`, `BR-027`, `BR-035`, `UC-01`, `UC-13`, `UC-17`, `NFR-008`, `NFR-025`.

## Verification command

```powershell
pnpm --filter @ihepsrs/api iam003:check
```
