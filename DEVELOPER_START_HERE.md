# Developer Start Here

## 1. Pick your Task
Open the phase `TODO.md`, then open the corresponding `TASK-*.md`.

## 2. Read real references
The Task now includes actual:
- FR
- BR
- UC
- NFR
- Analysis sections
- Test IDs

## 3. Read only needed domain docs
Examples:
- Thesis task → `docs/14_state_models.md`, `docs/data_dictionary/Thesis.md`, `docs/13_business_rules.md`
- Integration task → `docs/16_integration.md`, `docs/17_security.md`
- IAM task → `docs/17_security.md`
- Reporting task → `docs/19_testing.md`, KPI section in Baseline-derived docs

## 4. Design before coding if needed
If the task needs an API/DB/technology decision not fixed by Analysis:
create an ADR in `architecture/decisions/`.

## 5. Implement + test
Use IDs in the Task to name/reference tests and PRs.

## 6. Pull Request
Do not merge if:
- a Business Rule is bypassed,
- a new State was invented,
- Source of Truth changed,
- required test IDs are missing,
- scope changed without CR.
