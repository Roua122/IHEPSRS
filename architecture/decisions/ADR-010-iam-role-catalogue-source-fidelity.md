# ADR-010 — IAM-002 Role Catalogue Source Fidelity

Status: Accepted  
Date: 2026-10-02  
Related Task: TASK-IAM-002

## Context

Analysis Baseline Section 4.3 contains the canonical organizational role catalogue.
Eleven rows have explicit role symbols (`CGA` through `RC`). Three later rows describe
`Student/Applicant`, `Researcher/Supervisor`, and `Committee Member/External Examiner`
but their role-code cells are blank in the approved baseline table.

The security permission matrix in Section 14 uses broader labels such as `Central Admin`,
`Postgrad`, and `Research`. It does not provide an unambiguous one-to-one mapping from each
Section 4.3 role code to every permission-matrix column.

## Decision

IAM-002 implements the eleven explicit Section 4.3 codes as the assignable role-code
catalogue:

`CGA`, `IRS`, `UA`, `PGA`, `PGO`, `RA`, `RO`, `DS`, `IO`, `SA`, `RC`.

The three uncoded Section 4.3 rows are preserved as source rows but are not assigned
invented technical identifiers.

`RoleAssignment.roleCode` must reference one of the explicit catalogue codes implemented
by this task.

IAM-002 does not create a permission entity or infer a fine-grained permission mapping from
the broader Section 14 matrix. Scope-aware authorization remains owned by IAM-003 and
delegation enforcement by IAM-004.

## Consequences

- The implementation remains traceable to the approved baseline.
- Unknown/fabricated role codes fail closed.
- No business role identifier is invented silently.
- The source gap for the three uncoded rows is visible for later approved resolution.
- IAM-003 can build authorization decisions on stable role codes without changing IAM-002.

## Analysis references

- Analysis Baseline Section 4.3 — Role catalogue and responsible entities.
- Analysis Baseline Section 14 — Security / permission matrix.
- FR-003, BR-027, BR-028, UC-17, UC-24, NFR-008, NFR-011.
