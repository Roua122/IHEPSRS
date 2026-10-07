# IAM-002 — Role Catalogue Developer Reference

TASK-IAM-002 implements the role-code catalogue required by FR-003 while preserving the
approved Analysis Baseline without inventing missing role identifiers.

## Canonical coded roles

Source: Analysis Baseline Section 4.3.

| roleCode | Role | Baseline scope |
| --- | --- | --- |
| CGA | Central Governance Admin | Cross-Institution |
| IRS | Institution Registry Steward | Cross/Institution |
| UA | University Admin | Institution |
| PGA | Postgraduate Authority | Institution/Program |
| PGO | Postgraduate Officer/Reviewer | Institution/Program |
| RA | Research Authority | Institution |
| RO | Research Officer/Reviewer | Institution |
| DS | Data Steward | Scoped |
| IO | Integration Operator | Scoped System |
| SA | Security Admin | Scoped/Central |
| RC | Records Admin | Scoped |

## Source gap preserved deliberately

The same Section 4.3 table contains three rows with no explicit value in the role-code cell:

- Student/Applicant — Self
- Researcher/Supervisor — Self/Assigned
- Committee Member/External Examiner — Assigned Case

IAM-002 keeps these rows visible but does not fabricate identifiers for them. See ADR-010.

## RoleAssignment boundary

The domain model mirrors `docs/data_dictionary/RoleAssignment.md`:

- assignmentId
- userId
- roleCode
- institutionId (nullable for a central role)
- validFrom
- validTo (optional)
- grantedBy

IAM-002 validates that `roleCode` exists in the explicit catalogue. It also rejects an
invalid/inverted validity interval as data-integrity validation.

No RoleAssignment write endpoint is published yet. Operational writes require the real
authorization and authentication path owned by IAM-003/IAM-005.

## Permission-matrix boundary

`docs/17_security.md` contains a permission matrix with broader columns such as
`Central Admin`, `Postgrad`, `Research`, `Student`, and `Researcher`.

IAM-002 does not silently convert those broad labels into a one-to-one permission mapping
for the Section 4.3 role codes because that mapping is not fully explicit in the baseline.
IAM-003 consumes the role catalogue when implementing the actual access decision:

`Authenticated User + Role + Institution/Data Scope + Resource + Action + Record State`.

## Prototype endpoint

Read-only catalogue metadata:

```text
GET /api/identity/role-catalogue
```

The endpoint exposes no user assignments and no sensitive write operation.

Frontend preview:

```text
/settings/roles
```

## Verification

```powershell
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @ihepsrs/api iam001:check
pnpm --filter @ihepsrs/api iam002:check
```

The IAM-002 executable check preserves source IDs in test labels. It intentionally does not
claim that BR-028 delegation enforcement, full NFR-008 request authorization, or NFR-011
audit persistence/tamper evidence are complete; those require their owning IAM/audit work.
