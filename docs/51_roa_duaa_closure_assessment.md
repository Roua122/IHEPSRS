# رؤى ودعاء — Academic Prototype Closure Assessment

**Assessment date:** 2026-10-11  
**Verdict:** **0/5 tasks formally closed by this assessment**; implementation progress is substantial but outstanding proof/approvals remain.  
**Important:** Do **not** infer an official done percentage from passing focused checks. This is a **pre-acceptance assessment**, not a claim that the tasks are unimplemented.

## Known GitHub evidence and version boundary

| Evidence | Verified result | Limitation |
| --- | --- | --- |
| PR #18 https://github.com/Roua122/IHEPSRS/pull/18 | Merged into `main` at `28ed1a1660376195cd6bfdcd9ae658e11d854f74`; head `372fa4362e3c8c7244f707cb79c9a8f970465aba` | This is the **earlier** implementation increment. |
| PR #18 CI https://github.com/Roua122/IHEPSRS/actions/runs/38153665914 | `success` | Runs the earlier 35-case defense suite and 14-case security suite. |
| Main CI https://github.com/Roua122/IHEPSRS/actions/runs/38153704180 | `success` | Confirms earlier merged source, *not* the newer unmerged 12-file increment. |
| New local increment: `IHEPSRS_Roa_Duaa_completion_increment_modified_files.zip` | 23 additional eligibility/read-audit checks passed in local offline harness on 2026-10-11 | `pnpm quality`, PR CI, CodeQL and dependency scans **not verified for this increment**. |
| `architecture/decisions/ADR-017-defense-eligibility-prototype-boundary.md` | Proposed rule for internal examiner PGA attestation and canonical Researcher/COI gate | **PROPOSED, NOT APPROVED.** External examiners still fail closed. |

Existing focused test evidence in `DUAA_TH005_TH008_FOCUSED_QA.md` and `ROA_HRD001_SECURITY_VERIFICATION.md`; neither is a full end-to-end sign-off.

## Per-task requirement-to-evidence matrix

Legend: **M** = demonstrated in merged implementation/focused tests; **L** = newer increment locally checked only; **P** = pending direct acceptance/integration/sign-off; **N/A-production** = record a scope-approved documentation boundary; do not simply mark PASS.

| Task | Source requirement IDs | Demonstrated | Remaining gates | Current assessment |
| --- | --- | --- | --- | --- |
| **TH005** Committee & scheduling | FR-018/019, BR-015/016, NFR-014, UC-08 | **M:** positive/negative scheduling rules, approved committee, duplicate rejection, audit rollback. **L:** 23-check institutional PGA attestation/researcher/COI/read audit increment | Apply newer increment; pass official CI; obtain ADR-017 approval; demonstrate real API scheduling with trusted internal examiner identities; document external examiner scope | **ACCEPTANCE REVIEW / BLOCKED on ADR** |
| **TH006** Defense result | FR-019/020, BR-017/018/019/046/047, NFR-011/014, UC-09 | **M:** 35-case suite covers minutes, four outcomes, ReDefense exception and preserved session history | API demonstration of signed-in decision maker, audit/correlation and trusted minutes evidence adapter or approved mock; retention limitations documented | **ACCEPTANCE REVIEW** |
| **TH007** Corrections | FR-016/020, BR-018/047, NFR-014, UC-09 | **M:** mandatory correction creation, verification/denial, failed/partial correction protection, retained attempts | Record test of correction attachment/evidence boundary or approved mock, authenticated verifier and end-to-end API proof | **ACCEPTANCE REVIEW** |
| **TH008** Thesis approval/archive | FR-020/040/045, BR-019/026/054/059, NFR-011/014, UC-09/18 | **M:** immutable approval version, archived no-write, as-of/history checks; differentiated thesis approval from degree award | Evidence of archive access, as-of case, retention boundary approval, plus PG005 separate degree-decision readiness contract/no-bypass demonstration | **ACCEPTANCE REVIEW** |
| **HRD001** Security verification | FR-003/037, BR-027/028/060, NFR-008–011/025–034/036, UC-01/17/20 | **M:** 14 focused scope/audit/authentication checks + IAM regression. **L:** read-audit/eligibility tests and added security workflow configuration | Official SAST/SCA scan results; API negative authorization/tenant checks; integration identity/replay/SEC-403 evidence owned with Integration team; mock-vs-production NFR exclusion approved; incident/sensitive file/boundary verification | **ACCEPTANCE REVIEW / BLOCKED on integration evidence** |

### Original Definition of Done cross-check

| DoD item in task templates | Current evidence | To finish |
| --- | --- | --- |
| IMPLEMENT completed | Strong implementation evidence (TH005–008); focused security verification (HRD001) | Demonstrate end-to-end trust boundaries; dependent services must not be bypassed |
| FR/BR/NFR traceable | Task spec IDs + focused test case names | PR summary and final acceptance evidence per task |
| State/validation rules | Focused cases pass | Real API acceptance; replay/cross-scope and unauthorized cases |
| Authorization/scope | Focused cases pass | Cross-role/cross-institution HTTP proof |
| Audit/observability | In-process hash-chain checks; some sensitive reads in newer increment | API correlation/audit, signed audit scope vs retention limitations |
| Tests passing | Earlier merged suites: yes. New 23: offline-local only | `pnpm quality`, targeted tests, CI and security scans at **same** new SHA |
| No secrets committed | No secrets seen in focused tests | CI secret scan/repository review at new SHA; do not assume `pnpm quality` includes this |
| Docs & ADR | Existing QA, proposed ADR-017 | Reviewer approval, accepted mock boundaries |
| No unapproved new semantics | Proposed ADR-017 preserves existing rules subject to review | Formal architectural/academic reviewer decision |

## Work ordered by dependency (do not skip)

1. **Land the latest 12-file increment in a fresh branch from updated `main`**. Run focused and regression checks; open PR. Confirm CodeQL/SCA scan workflows run and pass at that SHA (investigate any missing workflows/permissions).
2. **Academic decision on ADR-017:** accept institutional attestations for *internal* eligible examiners in the demo; external members remain excluded unless a trusted adapter is delivered. Record reviewer/date/link. No automatic approval is assumed.
3. **Document evidence decision:** choose trusted DocumentLink mock/adapter for minutes and correction evidence. Must be server-verified, scan/quarantine fail closed, scoped and audit-logged. The current `minutes` string and `evidenceNote` alone do not establish verified files.
4. **Cross-service demonstration:** run actual login + authorized/not-authorized cases; Submitted→Committee→Scheduled→Minutes→Outcome→Corrections→Approved→Archived, plus denied early approval, forbidden cross-scope and record-history retrieval.
5. **PG005 boundary proof:** final Thesis Approved must not auto-award degree; independently prove failed readiness/holds gates and separate award decision when trusted evidence exists.
6. **HRD001 evidence:** prove identity/integration controls or secure documented mock, scan results, security event/tamper handling and an incident drill. Production-only KMS/DR/SIEM/real infrastructure stays unverified and needs academic sign-off as scoped out, not fabricated as passed.
7. **Task sign-off & RTM:** attach links and fill `docs/53_roa_duaa_acceptance_signoff.md`. Only then change each task's `Status` and DoD boxes if independently accepted.

## Global demo gates outside this team's closure

The following `docs/25_prototype_acceptance.md` conditions **cannot** be certified by these two members' focused checks alone: Mock University→Student integration, monitor success/error/replay, institution-wide applicant→enrollment, live Publication mapping, Dashboard using true domain data, and full no-manual-DB edit demo. Those remain separate **whole-project** acceptance gates.

## Final decision today

- **TH005:** NOT DONE (ADR-017 + official tests + API acceptance).
- **TH006:** NOT DONE (minutes evidence integration/mock approval + API acceptance).
- **TH007:** NOT DONE (correction evidence integration/mock approval + API acceptance).
- **TH008:** NOT DONE (archive/degree boundary API evidence + sign-off).
- **HRD001:** NOT DONE (integration security evidence + scan results + security sign-off).

This assessment is intentionally conservative; it is **not** a request to implement full production infrastructure for the academic prototype.
