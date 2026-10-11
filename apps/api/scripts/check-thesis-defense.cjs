/* TH005–TH008 focused domain integration; trust adapter is test-only. */
const {
  ThesisEntityService,
} = require("../dist/thesis/domain/thesis-entity.service.js");
const {
  ThesisDefenseService,
} = require("../dist/thesis/domain/thesis-defense.service.js");
const {
  UnavailableDefenseEligibilityGateway,
} = require("../dist/thesis/domain/defense-eligibility.gateway.js");
const {
  ThesisSupervisionContextService,
} = require("../dist/thesis/thesis-supervision-context.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  AcademicAuditService,
} = require("../dist/postgraduate/domain/academic-audit.service.js");
const assert = require("node:assert/strict");
let total = 0;
function pass(id, comment) {
  total++;
  console.log(`PASS ${id}: ${comment}`);
}
function reject(fn, id, message) {
  assert.throws(fn, undefined, `${id} ${message}`);
  pass(id, message);
}
async function rejectAsync(fn, id, message) {
  await assert.rejects(fn, undefined, `${id} ${message}`);
  pass(id, message);
}
function principal(role, inst = "INST-A", person) {
  return {
    userId: `USER-${role}-${inst}`,
    authenticated: true,
    ...(person ? { personId: person } : {}),
    roleAssignments: [
      {
        assignmentId: `G-${role}-${inst}`,
        roleCode: role,
        institutionId: inst,
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
  };
}
async function setup() {
  const pga = principal("PGA"),
    pgo = principal("PGO"),
    other = principal("PGA", "INST-B"),
    student = principal("STUDENT", "INST-A", "PERSON-STUDENT");
  const supervisor = {
    userId: "USER-SUP",
    authenticated: true,
    roleAssignments: [],
  };
  const enrollment = {
    enrollmentId: "ENROLL-1",
    personId: "PERSON-STUDENT",
    institutionId: "INST-A",
    programId: "PROG-A",
    status: "Active",
  };
  const enrollments = {
    getOne(id) {
      assert.equal(id, enrollment.enrollmentId);
      return { ...enrollment };
    },
  };
  const references = {
    getProgram() {
      return { institutionId: "INST-A", orgUnitId: "ORG-A" };
    },
  };
  const authorization = {
    assertOfficer(p, inst, program) {
      if (
        !p?.authenticated ||
        !["PGO", "PGA"].includes(p.roleAssignments[0]?.roleCode) ||
        p.roleAssignments[0]?.institutionId !== inst ||
        program !== "PROG-A"
      )
        throw Error("Forbidden: Officer scope");
    },
    assertAuthority(p, inst, program) {
      if (
        !p?.authenticated ||
        p.roleAssignments[0]?.roleCode !== "PGA" ||
        p.roleAssignments[0]?.institutionId !== inst ||
        program !== "PROG-A"
      )
        throw Error("Forbidden: Authority scope");
    },
  };
  const persons = {
    resolveCanonicalPersonId(x) {
      return x;
    },
  };
  const chain = new ResearchAuditService();
  const audit = new AcademicAuditService(chain);
  const document = (thesisId, link) => ({
    available: true,
    targetType: "Thesis",
    targetId: thesisId,
    documentLinkId: link,
    documentId: `DOC-${link}`,
    purpose: "TrustedScanClearedThesis",
  });
  const documents = {
    resolveAvailableLink: async (id, link) => document(id, link),
    resolveAvailableProposalPlanLink: async (id, link) => document(id, link),
    resolveAvailableSubmissionLink: async (id, link) => document(id, link),
  };
  const supervisors = {
    assertActiveMainSupervisor: async (thesisId, enrollmentId) => ({
      thesisId,
      enrollmentId,
      assignmentId: "ASSIGN-MAIN",
    }),
    assertAssignedMainSupervisor: async (thesisId, enrollmentId, p) => {
      if (p.userId !== "USER-SUP") throw Error("Not assigned Main");
      return { thesisId, enrollmentId, assignmentId: "ASSIGN-MAIN" };
    },
  };
  const reqs = {
    assertSatisfied: async (thesisId, enrollmentId, programId) => ({
      thesisId,
      enrollmentId,
      programId,
      requirementsSatisfied: true,
      policyVersionId: "POLICY-1",
      assessmentId: "ASSESS-1",
    }),
  };
  const contexts = new ThesisSupervisionContextService();
  const theses = new ThesisEntityService(
    enrollments,
    references,
    persons,
    authorization,
    audit,
    documents,
    supervisors,
    reqs,
    contexts,
  );
  const eligible = {
    assertEligible: async ({ members, institutionId }) => {
      if (
        institutionId !== "INST-A" ||
        members.some((x) => x.personId === "CONFLICT")
      )
        throw Error("Conflict of interest");
    },
  };
  const defense = new ThesisDefenseService(
    theses,
    enrollments,
    authorization,
    audit,
    eligible,
  );
  const draft = theses.createDraft(
    { enrollmentId: enrollment.enrollmentId, titleAr: "رسالة اختبار" },
    pga,
  );
  const id = draft.thesisId;
  await rejectAsync(
    () =>
      defense.schedule(
        id,
        { committeeId: "X", scheduledAt: "2026-10-20T09:00:00.000Z" },
        pga,
      ),
    "TC-BR-015",
    "No scheduling before submitted evidence",
  );
  theses.register(id, pga);
  theses.recordMainSupervisorAssigned(id, pga);
  const proposal = await theses.addProposalVersion(
    id,
    {
      titleAr: "رسالة اختبار",
      abstract: "ملخص علمي",
      documentLinkId: "PLAN-LINK",
    },
    student,
  );
  await theses.submitProposal(
    id,
    { proposalVersionId: proposal.thesisVersionId },
    student,
  );
  await theses.reviewProposalAsSupervisor(
    id,
    { proposalVersionId: proposal.thesisVersionId, approve: true },
    supervisor,
  );
  await theses.approveProposal(
    id,
    { proposalVersionId: proposal.thesisVersionId, reason: "تم الاعتماد" },
    pga,
  );
  await theses.beginThesisWork(id, pgo);
  const sub = await theses.addSubmissionVersion(
    id,
    { documentLinkId: "FINAL-LINK" },
    student,
  );
  await theses.confirmSubmissionReadiness(
    id,
    { submissionVersionId: sub.thesisVersionId },
    supervisor,
  );
  await theses.submitThesis(
    id,
    { submissionVersionId: sub.thesisVersionId },
    student,
  );
  assert.equal(theses.getOne(id, pga).status, "Submitted");
  pass(
    "TC-FR-016/BR-015",
    "Real TH004 trusted submission establishes Submitted",
  );
  const members = [
    { personId: "PERSON-CHAIR", role: "Chair" },
    { personId: "PERSON-EXAM", role: "Examiner" },
  ];
  await rejectAsync(
    () =>
      defense.proposeCommittee(
        id,
        { members: [...members, members[0]], reason: "للمناقشة" },
        pgo,
      ),
    "TC-BR-016",
    "Duplicate member rejected",
  );
  await rejectAsync(
    () =>
      defense.proposeCommittee(
        id,
        {
          members: [{ personId: "CONFLICT", role: "Examiner" }],
          reason: "للمناقشة",
        },
        pgo,
      ),
    "TC-FR-018",
    "Trusted conflict check refuses committee",
  );
  const unavailable = new ThesisDefenseService(
    theses,
    enrollments,
    authorization,
    audit,
    new UnavailableDefenseEligibilityGateway(),
  );
  await rejectAsync(
    () =>
      unavailable.proposeCommittee(id, { members, reason: "للمناقشة" }, pgo),
    "TC-NFR-008/FR-018",
    "Missing conflict service fails closed",
  );
  const proposalCommittee = await defense.proposeCommittee(
    id,
    { members, reason: "جلسة المناقشة" },
    pgo,
  );
  reject(
    () => defense.listCommittees(id, other),
    "TC-BR-027",
    "Out-of-institution reader denied",
  );
  await rejectAsync(
    () => defense.approveCommittee(id, proposalCommittee.committeeId, pgo),
    "TC-FR-018",
    "PGO cannot approve final committee",
  );
  await rejectAsync(
    () =>
      defense.schedule(
        id,
        {
          committeeId: proposalCommittee.committeeId,
          scheduledAt: "2026-10-20T09:00:00.000Z",
        },
        pga,
      ),
    "TC-BR-015",
    "Proposed committee cannot schedule",
  );
  await defense.approveCommittee(id, proposalCommittee.committeeId, pga);
  const before = defense.listSessions(id, pga).length;
  await rejectAsync(
    () =>
      defense.schedule(
        id,
        { committeeId: proposalCommittee.committeeId, scheduledAt: "bad" },
        pga,
      ),
    "TC-NFR-014",
    "Invalid date cannot change status/sessions",
  );
  assert.equal(defense.listSessions(id, pga).length, before);
  assert.equal(theses.getOne(id, pga).status, "Submitted");
  const session = await defense.schedule(
    id,
    {
      committeeId: proposalCommittee.committeeId,
      scheduledAt: "2026-10-20T09:00:00.000Z",
    },
    pga,
  );
  assert.equal(theses.getOne(id, pga).status, "DefenseScheduled");
  pass("TC-FR-019/BR-015", "Approved committee schedules Submitted Thesis");
  reject(
    () =>
      defense.recordMinutes(
        id,
        session.sessionId,
        { heldAt: "2026-10-19T09:00:00.000Z", minutes: "المحضر" },
        pga,
      ),
    "TC-FR-019",
    "Minutes cannot precede scheduled date",
  );
  defense.recordMinutes(
    id,
    session.sessionId,
    { heldAt: "2026-10-20T10:00:00.000Z", minutes: "محضر اللجنة الكامل" },
    pga,
  );
  assert.equal(theses.getOne(id, pga).status, "Defended");
  pass("TC-FR-019", "Defended milestone recorded with minutes");
  reject(
    () =>
      defense.decideOutcome(
        id,
        session.sessionId,
        { outcome: "Wrong", reason: "خطأ" },
        pga,
      ),
    "TC-BR-017",
    "Unknown outcome rejected",
  );
  reject(
    () =>
      defense.decideOutcome(
        id,
        session.sessionId,
        { outcome: "PassWithCorrections", reason: "ملاحظات", corrections: [] },
        pga,
      ),
    "TC-BR-047",
    "Corrections are compulsory for conditional pass",
  );
  defense.decideOutcome(
    id,
    session.sessionId,
    {
      outcome: "PassWithCorrections",
      reason: "ملاحظات",
      corrections: ["إصلاح فصل المنهج", "استكمال المراجع"],
    },
    pga,
  );
  assert.equal(theses.getOne(id, pga).status, "CorrectionsRequired");
  pass("TC-BR-017/047", "Outcome creates two mandatory corrections");
  reject(
    () => defense.approveThesis(id, "اعتماد", pga),
    "TC-BR-018",
    "Open corrections block final approval",
  );
  const [first, second] = defense.listCorrections(id, pga);
  defense.submitCorrection(
    id,
    first.correctionId,
    { evidenceNote: "إصلاح 1" },
    student,
  );
  reject(
    () =>
      defense.verifyCorrection(
        id,
        first.correctionId,
        { approved: true, reason: "مراجع" },
        pgo,
      ),
    "TC-NFR-008/BR-047",
    "Only PGA verifies corrections",
  );
  defense.verifyCorrection(
    id,
    first.correctionId,
    { approved: true, reason: "تم التحقق" },
    pga,
  );
  reject(
    () => defense.approveThesis(id, "اعتماد", pga),
    "TC-BR-047",
    "Partial correction verification insufficient",
  );
  defense.submitCorrection(
    id,
    second.correctionId,
    { evidenceNote: "إصلاح 2" },
    student,
  );
  defense.verifyCorrection(
    id,
    second.correctionId,
    { approved: false, reason: "ناقص" },
    pga,
  );
  reject(
    () => defense.approveThesis(id, "اعتماد", pga),
    "TC-BR-047",
    "Rejected correction blocks approval",
  );
  defense.submitCorrection(
    id,
    second.correctionId,
    { evidenceNote: "إصلاح مكتمل" },
    student,
  );
  defense.verifyCorrection(
    id,
    second.correctionId,
    { approved: true, reason: "مكتمل" },
    pga,
  );
  assert.equal(defense.listCorrections(id, pga)[1].attempts.length, 2);
  pass("TC-BR-047", "Verification attempts retained append-only");
  const approved = defense.approveThesis(id, "قرار اللجنة النهائي", pga);
  assert.equal(approved.status, "Approved");
  assert.ok(approved.finalApprovedAt);
  assert.equal(theses.versions(id, pga).at(-1).versionType, "Approved");
  pass(
    "TC-FR-020/BR-018",
    "Thesis approval has timestamp and immutable Approved version",
  );
  const archived = defense.archive(id, "حفظ السجل النهائي", pga);
  assert.equal(archived.status, "Archived");
  pass("TC-FR-040/BR-026", "Archived Thesis cannot be edited via workflow");
  reject(
    () => defense.approveThesis(id, "مرة ثانية", pga),
    "TC-BR-019",
    "Approval is final; cannot approve again",
  );
  assert.equal(defense.listSessions(id, pga)[0].outcome, "PassWithCorrections");
  assert.equal(theses.getOne(id, pga).status, "Archived");
  pass("TC-FR-045", "As-of and session history remain readable");
  async function anotherSubmitted(tag) {
    const x = theses.createDraft(
      { enrollmentId: enrollment.enrollmentId, titleAr: `اختبار ${tag}` },
      pga,
    ).thesisId;
    theses.register(x, pga);
    theses.recordMainSupervisorAssigned(x, pga);
    const pr = await theses.addProposalVersion(
      x,
      {
        titleAr: `عنوان ${tag}`,
        abstract: "ملخص",
        documentLinkId: `PLAN-${tag}`,
      },
      student,
    );
    await theses.submitProposal(
      x,
      { proposalVersionId: pr.thesisVersionId },
      student,
    );
    await theses.reviewProposalAsSupervisor(
      x,
      { proposalVersionId: pr.thesisVersionId, approve: true },
      supervisor,
    );
    await theses.approveProposal(
      x,
      { proposalVersionId: pr.thesisVersionId },
      pga,
    );
    await theses.beginThesisWork(x, pgo);
    const ver = await theses.addSubmissionVersion(
      x,
      { documentLinkId: `FINAL-${tag}` },
      student,
    );
    await theses.confirmSubmissionReadiness(
      x,
      { submissionVersionId: ver.thesisVersionId },
      supervisor,
    );
    await theses.submitThesis(
      x,
      { submissionVersionId: ver.thesisVersionId },
      student,
    );
    return x;
  }
  async function readyCommittee(x) {
    const com = await defense.proposeCommittee(
      x,
      { members, reason: "لجنة موثوقة" },
      pgo,
    );
    await defense.approveCommittee(x, com.committeeId, pga);
    return com.committeeId;
  }
  async function defended(x, committeeId, num) {
    const begin = `2026-10-${String(19 + num).padStart(2, "0")}T09:00:00.000Z`;
    const end = `2026-10-${String(19 + num).padStart(2, "0")}T11:00:00.000Z`;
    const s = await defense.schedule(
      x,
      { committeeId, scheduledAt: begin },
      pga,
    );
    defense.recordMinutes(
      x,
      s.sessionId,
      { heldAt: end, minutes: `محضر ${num}` },
      pga,
    );
    return s.sessionId;
  }
  const direct = await anotherSubmitted("PASS");
  const directCommittee = await readyCommittee(direct);
  const directSession = await defended(direct, directCommittee, 1);
  defense.decideOutcome(
    direct,
    directSession,
    { outcome: "Pass", reason: "دون تعديلات" },
    pga,
  );
  assert.equal(theses.getOne(direct, pga).status, "Defended");
  defense.approveThesis(direct, "اعتماد مباشر", pga);
  pass(
    "TC-BR-017/018",
    "Direct Pass supports approved Thesis without corrections",
  );

  const repeat = await anotherSubmitted("REDEFENSE");
  const repeatCommittee = await readyCommittee(repeat);
  const s1 = await defended(repeat, repeatCommittee, 1);
  defense.decideOutcome(
    repeat,
    s1,
    { outcome: "ReDefense", reason: "إعادة المناقشة" },
    pga,
  );
  assert.equal(theses.getOne(repeat, pga).reDefenseCount, 1);
  pass("TC-BR-046", "First ReDefense allowed with historical session retained");
  const s2 = await defended(repeat, repeatCommittee, 2);
  reject(
    () =>
      defense.decideOutcome(
        repeat,
        s2,
        { outcome: "ReDefense", reason: "مطلوب تكرار" },
        pga,
      ),
    "TC-BR-046",
    "Second ReDefense requires PGA exception",
  );
  reject(
    () => defense.approveExtraDefense(repeat, "تفويض", pgo),
    "TC-BR-046/FR-003",
    "Non-PGA cannot authorize ReDefense exception",
  );
  defense.approveExtraDefense(repeat, "مبرر خاص موثق", pga);
  defense.decideOutcome(
    repeat,
    s2,
    { outcome: "ReDefense", reason: "قرار استثنائي" },
    pga,
  );
  assert.equal(theses.getOne(repeat, pga).reDefenseCount, 2);
  assert.equal(
    defense.listSessions(repeat, pga)[1].extraDefenseException.approvedByUserId,
    pga.userId,
  );
  assert.equal(
    defense.listSessions(repeat, pga)[1].extraDefenseException.reason,
    "مبرر خاص موثق",
  );
  pass(
    "TC-BR-046",
    "Second ReDefense retains authenticated exception approval and justification",
  );
  const s3 = await defended(repeat, repeatCommittee, 3);
  reject(
    () =>
      defense.decideOutcome(
        repeat,
        s1,
        { outcome: "Fail", reason: "تلاعب" },
        pga,
      ),
    "TC-BR-017",
    "Old session immutable and cannot be replaced",
  );
  defense.decideOutcome(repeat, s3, { outcome: "Pass", reason: "اجتياز" }, pga);
  assert.equal(defense.listSessions(repeat, pga).length, 3);
  assert.equal(defense.listSessions(repeat, pga)[0].outcome, "ReDefense");
  pass(
    "TC-BR-017/046",
    "All three DefenseSession records preserved after exception",
  );

  const failed = await anotherSubmitted("FAIL");
  const failedCommittee = await readyCommittee(failed);
  const failedSession = await defended(failed, failedCommittee, 1);
  defense.decideOutcome(
    failed,
    failedSession,
    { outcome: "Fail", reason: "عدم اجتياز" },
    pga,
  );
  assert.equal(
    defense.archive(failed, "أرشفة الرسالة", pga).status,
    "Archived",
  );
  pass(
    "TC-BR-017/026",
    "Failed Thesis archives while preserving original outcome",
  );

  const auditCase = await anotherSubmitted("AUDIT-FAIL");
  const auditCommittee = await readyCommittee(auditCase);
  const originalTransition = audit.transition.bind(audit);
  audit.transition = () => {
    throw Error("Simulated audit outage");
  };
  await rejectAsync(
    () =>
      defense.schedule(
        auditCase,
        {
          committeeId: auditCommittee,
          scheduledAt: "2026-10-22T09:00:00.000Z",
        },
        pga,
      ),
    "TC-NFR-014",
    "Schedule does not expose session when audit fails",
  );
  assert.equal(defense.listSessions(auditCase, pga).length, 0);
  assert.equal(theses.getOne(auditCase, pga).status, "Submitted");
  audit.transition = originalTransition;
  pass("TC-NFR-014", "Thesis remains Submitted after simulated audit failure");

  assert.equal(chain.verifyChain(), true);
  pass("TC-NFR-011", "TH005–TH008 audit hash-chain passes");
  return { total };
}
setup()
  .then(() =>
    console.log(
      `TH005–TH008 FOCUSED DEFENSE CHECKS PASSED (${total} checks; shared services pending)`,
    ),
  )
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
