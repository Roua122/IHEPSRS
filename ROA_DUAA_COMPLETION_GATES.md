# IHEPSRS — رؤى ودعاء: شروط إغلاق المهام

## Scope of this handoff

This increment continues merged PR #18 (`372fa43`) and targets a **prototype-compliant trusted eligibility boundary** plus expanded security verifications. It does **not** silently change the full-system Definition of Done or mark infrastructure controls passed.

### دعاء — TH005–TH008

- **Implemented and verified in local focused harness:** committee proposals/approval, defense schedule/outcome, immutable session history, corrections, final thesis approval, archive, and server-side PGA-signed attestation with canonical researcher status/scope and Research COI evidence.
- `TH005` positive flow now available for **registered active internal examiners attested by PGA**. No approval without server-side attestation; known conflicts override any attestation.
- TH006/007 are still process-local prototype state with no immutable scanned document evidence for minutes/correction attachments.
- TH008 approves **Thesis** only. Academic **DegreeDecision** remains a distinct PG005 operation; do not claim degree awarded because Thesis is `Approved`.

### رؤى — HRD001

- Added read audit for defense-related sensitive entities, targeted negative-scope/COI tests, CodeQL SAST workflow and dependency advisory gate workflow.
- The new security workflow must pass in GitHub; enabling the workflow is not the same as receiving scan results.
- Must verify TLS, MFA deployment, KMS/encryption-at-rest, integration replay and SecurityEvent, SIEM, file scanning, DAST, penetration test, durable audit/retention and incident exercises with independent evidence. These are **NOT VERIFIED** in the prototype archive.

## Reproduce on Windows after extracting the ZIP in repository root

```powershell
pnpm format
pnpm --filter @ihepsrs/api thesis-defense:check
pnpm --filter @ihepsrs/api hardening-security:check
pnpm --filter @ihepsrs/api thesis:check
pnpm quality
git diff --check
git status
```

Before release, review `.github/workflows/security-scans.yml` and attach passing runs, verify contract/API and browser flows on an actual integrated demo environment, and obtain independent owner sign-off. **None of these steps were executed by the local offline harness**.

### Scope restriction

The verified researcher registry here covers only **internal active researchers**; external examiners remain denied until the integration owner supplies a trusted external identity/eligibility provider and conflict-declaration evidence. The in-memory attestation list is not a durable legally binding signature or a production authority record.

ADR-017 is proposed and must be explicitly accepted by the academic/security owners before marking prototype TH005 acceptance complete.
