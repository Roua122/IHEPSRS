# Action Flows

Source: Analysis Baseline — Section 7 and Section 11.

## Institution Onboarding
1. Create Institution and allocate `institutionId`.
2. Create academic structure/program/reference codes.
3. Register `IntegrationSystem` and authentication method.
4. Define external identifier mappings.
5. Execute Contract Test.
6. Run test synchronization and reconcile results.
7. Move system/institution integration to Active after approval.

## Postgraduate / Thesis
`Application → Review → Decision → Enrollment → Supervisor → Thesis Proposal → Progress → Submission → Committee → Defense → Corrections → Approval → Archive`

## Scientific Research
`Researcher → Proposal → Screening → Review → Decision → Project → Team/Funding → Outputs → Publication → Completion/Archive`

## Integration Processing
`Receive → Authenticate → Validate Contract → Map Canonical Model → Idempotency Check → Business Validation → Process → Audit → Acknowledge / Retry / Quarantine`

## Rule
State changes are Domain Operations. Direct field mutation to bypass a transition is rejected.
راجع `docs/14_state_models.md`.
