# ADR-PG-005 — Scoped enrollment policy and historical operations

Status: **Proposed — requires team/architecture approval**
Owner: TASK-PG-005 / رهف عادل
Baseline: FR-013/043/045, BR-003/008/009/052/053/054/062, section 11, 12.2.9 and 12.2.36.

## Context
The uploaded prototype API has a globally effective, versioned `BusinessPolicyService` (policy file) but no Program/Cohort-scoped `PolicyConfiguration` registry or persistent Enrollment repository. Baseline requires approved per-program/cohort study limits, pinned historical versions and independent status/decision history. Inventing fixed numeric limits, defaulting an unconfigured policy or treating `admissionCycleId` as a Cohort ID would violate the baseline.

## Proposed implementation boundary
- `EnrollmentPolicyService` is an **in-memory mock**, not the System of Record. It accepts explicit approved Program (or trusted Cohort) versions; no defaults. New versions are future-effective only and do not change Enrollment snapshots.
- Proposed `value` schema: `normalStudyMonths` (initial planned period), `maxStudyMonths` (absolute total limit), `maxExtensions` (count), `maxExtensionMonths` (single-extension maximum). **These field semantics are provisional and require owner approval**; baseline does not supply numeric limits or an explicit `normalStudyMonths` key.
- Approved policy selection gives precedence to a trusted Cohort mapping, if present, then Program. Cohort must be supplied by an INS owner; never infer it from an AdmissionCycle ID.
- `EnrollmentRecord.policyVersionId` pins a unique approved PolicyConfiguration record, alongside a defensive copy of the effective values.
- `BR-008` inactive program starts in `PendingValidation`; only a recorded authority decision against a newly effective version can activate it. Changing to a different program needs a separate verified admissions/transfer workflow.
- `BR-009` live duplicates are **blocked by default**, pending an approved exception/unique-index workflow (not a browser checkbox).
- `BR-053` re-enrollment creates another Enrollment record; the old Withdrawn record remains unchanged. Program change must be resolved with TH/INS owners before adding any state transition.
- `BR-054` degree decision requires a verified gateway to authoritative ProgramRequirements/Thesis/Holds; it will not infer completion from client-submitted booleans.

## Required decision before closing the task
Confirm scoped study-limits schema, authority approving institutional policies, Cohort data ownership, Program Change closure semantics, BR-009 exception procedure and transaction-bound persistent repository. No change to the Baseline/state model is requested by this document.
