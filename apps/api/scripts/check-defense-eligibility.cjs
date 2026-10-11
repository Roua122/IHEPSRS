/* TH005/HRD001 — institutional defense eligibility and read-audit regressions. */
const assert = require("node:assert/strict");
const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");
const {
  AcademicAuthorizationService,
} = require("../dist/postgraduate/domain/academic-authorization.service.js");
const {
  AcademicAuditService,
} = require("../dist/postgraduate/domain/academic-audit.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  ConflictOfInterestService,
} = require("../dist/research/domain/conflict-of-interest.service.js");
const {
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  InstitutionalDefenseEligibilityGateway,
} = require("../dist/thesis/domain/institutional-defense-eligibility.gateway.js");
const {
  ThesisDefenseService,
} = require("../dist/thesis/domain/thesis-defense.service.js");

let passed = 0;
function pass(id, text) {
  passed++;
  console.log(`PASS ${id}: ${text}`);
}
async function denies(f, id, reason) {
  await assert.rejects(async () => f());
  pass(id, reason);
}
function principal(role, institution = "INST-001", personId = undefined) {
  return {
    userId: `${role}-${institution}`,
    authenticated: true,
    personId,
    roleAssignments: [
      {
        assignmentId: `ASSIGN-${role}-${institution}`,
        roleCode: role,
        institutionId: institution,
        validFrom: "2025-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
  };
}
async function main() {
  const auth = new AcademicAuthorizationService(
    new AuthorizationDecisionService(),
  );
  const researchAudit = new ResearchAuditService();
  const audit = new AcademicAuditService(researchAudit);
  const persons = new PersonIdentityService();
  const conflicts = new ConflictOfInterestService({
    getPolicyAt: () => ({
      policyVersion: "COI-TEST",
      values: { "research.coi.recentCoauthorshipMonths": 24 },
    }),
  });
  const gateway = new InstitutionalDefenseEligibilityGateway(
    auth,
    persons,
    conflicts,
    audit,
  );
  const member = { personId: "P-101", role: "Examiner" };
  const input = {
    thesisId: "TH-VERIFY",
    enrollmentId: "EN-VERIFY",
    studentPersonId: "P-103",
    institutionId: "INST-001",
    programId: "PROGRAM-1",
    members: [member],
  };
  const sign = (p, overrides = {}) =>
    gateway.recordAttestation({
      ...input,
      member,
      conflictDeclared: false,
      reason: "Verified by institution",
      principal: p,
      ...overrides,
    });
  const pga = principal("PGA");
  const pgo = principal("PGO");
  await denies(
    () => gateway.assertEligible(input),
    "TC-FR-018",
    "Unattested member rejected by production DI adapter",
  );
  await denies(
    () => sign(pgo),
    "TC-FR-003/018",
    "Officer cannot sign PGA eligibility attestation",
  );
  await denies(
    () => sign(principal("PGA", "INST-002")),
    "TC-BR-027",
    "Cross-institution PGA denied",
  );
  await denies(
    () => sign(pga, { member: { personId: "P-103", role: "Examiner" } }),
    "TC-FR-018",
    "Thesis student cannot be examiner",
  );
  await denies(
    () => sign(pga, { member: { personId: "NO-PERSON", role: "Examiner" } }),
    "TC-FR-018",
    "Unknown candidate denied",
  );
  const signed = await sign(pga);
  assert.equal(signed.attestedByUserId, pga.userId);
  assert.equal(signed.member.personId, member.personId);
  pass("TC-FR-018/BR-016", "Scoped PGA attestation is identity-bound");
  await gateway.assertEligible(input);
  pass(
    "TC-FR-018",
    "Canonical active researcher and attestation allow committee",
  );
  const blocked = await sign(pga, {
    conflictDeclared: true,
    reason: "Conflict declared after initial approval",
  });
  assert.equal(blocked.conflictDeclared, true);
  await denies(
    () => gateway.assertEligible(input),
    "TC-FR-018",
    "Later conflict declaration revokes earlier positive eligibility",
  );
  await sign(pga, {
    reason: "PGA reviewed and cleared documented declaration",
  });
  await gateway.assertEligible(input);
  pass(
    "TC-FR-018/BR-016",
    "Latest authority attestation controls eligibility without deleting history",
  );
  await denies(
    () => gateway.assertEligible({ ...input, institutionId: "INST-002" }),
    "TC-BR-027",
    "Attestation cannot cross institutions",
  );
  await denies(
    () => gateway.assertEligible({ ...input, programId: "OTHER-PROGRAM" }),
    "TC-BR-027",
    "Attestation cannot cross programs",
  );
  await denies(
    () =>
      gateway.assertEligible({
        ...input,
        members: [{ ...member, role: "Chair" }],
      }),
    "TC-BR-016",
    "Attestation is bound to committee role",
  );
  await denies(
    () => gateway.assertEligible({ ...input, thesisId: "OTHER-THESIS" }),
    "TC-FR-018",
    "Attestation cannot be replayed for other Thesis",
  );
  // Real service flow via the same gateway class configured in ThesisModule.
  const liveGateway = new InstitutionalDefenseEligibilityGateway(
    auth,
    persons,
    new ConflictOfInterestService({
      getPolicyAt: () => ({ policyVersion: "COI-TEST", values: {} }),
    }),
    audit,
  );
  const lifecycle = { status: "Submitted" };
  const liveTheses = {
    getOne: () => ({
      thesisId: input.thesisId,
      enrollmentId: input.enrollmentId,
      status: lifecycle.status,
    }),
    assertSubmittedForDefense: async () => undefined,
    recordDefenseMilestone: (_id, from, to) => {
      assert.equal(lifecycle.status, from);
      lifecycle.status = to;
      return { status: to };
    },
  };
  const liveEnrollments = {
    getOne: () => ({
      enrollmentId: input.enrollmentId,
      personId: input.studentPersonId,
      institutionId: input.institutionId,
      programId: input.programId,
    }),
  };
  const liveDefense = new ThesisDefenseService(
    liveTheses,
    liveEnrollments,
    auth,
    audit,
    liveGateway,
  );
  await denies(
    () =>
      liveDefense.proposeCommittee(
        input.thesisId,
        { members: [member], reason: "Academic committee" },
        pgo,
      ),
    "TC-FR-018",
    "Real proposal flow refuses absent authority attestation",
  );
  await liveDefense.attestMember(
    input.thesisId,
    {
      member,
      conflictDeclared: false,
      reason: "Signed institutional eligibility check",
    },
    pga,
  );
  const proposal = await liveDefense.proposeCommittee(
    input.thesisId,
    { members: [member], reason: "Academic committee" },
    pgo,
  );
  pass(
    "TC-FR-018",
    "Authorized staff proposes committee using verified internal member",
  );
  const approved = await liveDefense.approveCommittee(
    input.thesisId,
    proposal.committeeId,
    pga,
  );
  assert.equal(approved.status, "Approved");
  pass("TC-FR-018/BR-016", "Scoped PGA approves attested committee");
  const session = await liveDefense.schedule(
    input.thesisId,
    {
      committeeId: proposal.committeeId,
      scheduledAt: "2026-11-12T09:00:00.000Z",
    },
    pga,
  );
  assert.equal(session.committeeId, approved.committeeId);
  assert.equal(lifecycle.status, "DefenseScheduled");
  pass(
    "TC-FR-019/BR-015",
    "Trusted internal committee can schedule submitted Thesis",
  );
  conflicts.registerDirectSupervisionEvidence({
    leftResearcherId: "RES-102",
    rightResearcherId: "RES-101",
  });
  await denies(
    () => gateway.assertEligible(input),
    "TC-FR-018/BR-016",
    "New canonical COI evidence invalidates eligibility",
  );
  await denies(
    () => sign(pga),
    "TC-FR-018/BR-016",
    "Known conflict cannot be overridden by fresh attestation",
  );
  assert.equal(researchAudit.verifyChain(), true);
  pass("TC-FR-037/NFR-011", "Attestation is hash-chain audited");
  const theses = {
    getOne: () => ({
      thesisId: input.thesisId,
      enrollmentId: input.enrollmentId,
      status: "Submitted",
    }),
  };
  const enrollments = {
    getOne: () => ({
      enrollmentId: input.enrollmentId,
      personId: input.studentPersonId,
      institutionId: input.institutionId,
      programId: input.programId,
    }),
  };
  const defense = new ThesisDefenseService(
    theses,
    enrollments,
    auth,
    audit,
    gateway,
  );
  await denies(
    () =>
      defense.attestMember(
        input.thesisId,
        { member, conflictDeclared: false, reason: "Attestation" },
        pgo,
      ),
    "TC-FR-003/018",
    "Public workflow rejects non-PGA attestation",
  );
  const prior = researchAudit.list().length;
  defense.listCommittees(input.thesisId, pga);
  defense.listSessions(input.thesisId, pga);
  defense.listCorrections(input.thesisId, pga);
  assert.equal(researchAudit.list().length, prior + 3);
  const names = researchAudit
    .list()
    .slice(-3)
    .map((x) => x.action);
  assert.deepEqual(names, [
    "ThesisCommittee.read",
    "DefenseSession.read",
    "ThesisCorrection.read",
  ]);
  pass(
    "TC-NFR-011/FR-037",
    "Sensitive committee, session and correction reads are audited",
  );
  assert.equal(researchAudit.verifyChain(), true);
  pass("TC-NFR-011", "Read events preserve hash-chain integrity");
  console.log(
    `INSTITUTIONAL DEFENSE ELIGIBILITY PASSED (${passed} checks; prototype only)`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
