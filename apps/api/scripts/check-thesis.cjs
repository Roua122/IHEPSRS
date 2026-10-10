const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");
const {
  InstitutionAuthorizationService,
} = require("../dist/institutions/institution-authorization.service.js");
const {
  InstitutionsService,
} = require("../dist/institutions/institutions.service.js");
const {
  PrototypeAuditService,
} = require("../dist/common/audit/prototype-audit.service.js");
const {
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  ThesisAuthorizationService,
} = require("../dist/thesis/thesis-authorization.service.js");
const {
  ThesisSupervisionContextService,
} = require("../dist/thesis/thesis-supervision-context.service.js");
const {
  ThesisSupervisorService,
} = require("../dist/thesis/thesis-supervisor.service.js");

function assert(condition, testId, message) {
  if (!condition) throw new Error(`${testId}: ${message}`);
  console.log(`PASS ${testId}: ${message}`);
}

function expectThrow(fn, testId, message) {
  let thrown = false;
  try {
    fn();
  } catch {
    thrown = true;
  }
  assert(thrown, testId, message);
}

function principal(userId, roleCode, institutionId) {
  return {
    userId,
    personId: `PERSON-${userId}`,
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: `A-${userId}-${roleCode}`,
        roleCode,
        institutionId,
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
  };
}

function setupInstitutions() {
  const decisions = new AuthorizationDecisionService();
  const authorization = new InstitutionAuthorizationService(decisions);
  const audit = new PrototypeAuditService();
  const institutions = new InstitutionsService(authorization, audit);
  const cga = principal("U-CGA", "CGA", null);
  const ua = principal("U-UA", "UA", "INST-001");

  institutions.createInstitution(
    {
      institutionId: "INST-001",
      code: "U-A",
      nameAr: "جامعة ألف",
      type: "University",
      status: "Active",
    },
    cga,
  );
  institutions.createOrgUnit(
    "INST-001",
    {
      orgUnitId: "OU-CS",
      type: "Department",
      nameAr: "قسم علوم الحاسوب",
      status: "Active",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2035-01-01",
    },
    ua,
  );
  institutions.createProgramVersion(
    "INST-001",
    {
      programId: "PRG-CS-MSC",
      orgUnitId: "OU-CS",
      degreeLevel: "Master",
      nameAr: "ماجستير علوم الحاسوب",
      status: "Active",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2035-01-01",
      thesisRequired: true,
      versionNo: 1,
    },
    ua,
  );
  return { decisions, institutions, ua };
}

function main() {
  console.log("=== Verification: TASK-TH-002 Supervisor assignment rules ===");

  const { decisions, institutions, ua } = setupInstitutions();
  const people = new PersonIdentityService();
  const contexts = new ThesisSupervisionContextService();
  const thesisAuthorization = new ThesisAuthorizationService(decisions);
  const thesisAudit = new PrototypeAuditService();
  const service = new ThesisSupervisorService(
    contexts,
    people,
    institutions,
    thesisAuthorization,
    thesisAudit,
  );

  const pga = principal("U-PGA", "PGA", "INST-001");
  const pgo = principal("U-PGO", "PGO", "INST-001");
  const pgaOther = principal("U-PGA-B", "PGA", "INST-002");

  contexts.register({
    thesisId: "TH-001",
    institutionId: "INST-001",
    programId: "PRG-CS-MSC",
    studentPersonId: "P-102",
  });

  expectThrow(
    () => service.assertReadyForInProgress("TH-001", "2026-10-01"),
    "TC-BR-011",
    "Thesis cannot enter InProgress before an approved active MAIN supervisor exists",
  );

  const eligible = service.checkEligibility(
    "TH-001",
    { researcherId: "RES-101", role: "MAIN", startDate: "2026-10-01" },
    pgo,
  );
  assert(
    eligible.eligible && eligible.limitPoints === 5,
    "TC-FR-014",
    "Postgraduate Officer can evaluate an active supervisor candidate against the baseline load limit",
  );

  expectThrow(
    () =>
      service.assignSupervisor(
        "TH-001",
        {
          researcherId: "RES-101",
          role: "MAIN",
          startDate: "2026-10-01",
          approvedByUserId: pgo.userId,
        },
        pgo,
      ),
    "TC-NFR-008-TH002",
    "PGO cannot self-approve the final supervisor assignment reserved for Postgraduate Authority",
  );

  expectThrow(
    () =>
      service.assignSupervisor(
        "TH-001",
        {
          researcherId: "RES-101",
          role: "MAIN",
          startDate: "2026-10-01",
          approvedByUserId: pgaOther.userId,
        },
        pgaOther,
      ),
    "TC-NFR-008-TH002",
    "Supervisor approval is denied outside the Thesis institution scope",
  );

  expectThrow(
    () =>
      service.assignSupervisor(
        "TH-001",
        {
          researcherId: "RES-101",
          role: "MAIN",
          startDate: "2026-10-01",
          approvedByUserId: "SPOOFED-APPROVER",
        },
        pga,
      ),
    "TC-BR-043",
    "approvedByUserId cannot be spoofed from the request body",
  );

  const initial = service.assignSupervisor(
    "TH-001",
    {
      researcherId: "RES-101",
      role: "MAIN",
      startDate: "2026-10-01",
      approvedByUserId: pga.userId,
      approvalDecisionId: "DEC-TH-001",
    },
    pga,
  );
  assert(
    initial.status === "Active" && initial.role === "MAIN",
    "TC-FR-014",
    "Approved initial MAIN supervisor assignment is stored as Active",
  );
  service.assertReadyForInProgress("TH-001", "2026-10-02");
  assert(
    service.getSupervisionReadiness("TH-001", pgo, "2026-10-02")
      .canEnterInProgress,
    "TC-BR-011",
    "One approved active MAIN supervisor satisfies the supervision readiness gate",
  );

  contexts.register({
    thesisId: "TH-SELF",
    institutionId: "INST-001",
    programId: "PRG-CS-MSC",
    studentPersonId: "P-101",
  });
  const selfEligibility = service.checkEligibility(
    "TH-SELF",
    { researcherId: "RES-101", role: "MAIN", startDate: "2026-10-01" },
    pgo,
  );
  assert(
    !selfEligibility.eligible,
    "TC-BR-043",
    "A Thesis student Person cannot be assigned as their own supervisor",
  );

  expectThrow(
    () =>
      service.assignSupervisor(
        "TH-001",
        {
          researcherId: "RES-102",
          role: "MAIN",
          startDate: "2026-11-01",
          approvedByUserId: pga.userId,
        },
        pga,
      ),
    "TC-BR-043",
    "Changing the active MAIN supervisor requires changeReason",
  );

  const replacement = service.assignSupervisor(
    "TH-001",
    {
      researcherId: "RES-102",
      role: "MAIN",
      startDate: "2026-11-01",
      changeReason: "Approved supervision change",
      approvedByUserId: pga.userId,
      approvalDecisionId: "DEC-TH-002",
    },
    pga,
  );
  const history = service.listAssignments("TH-001", pgo);
  assert(
    history.length === 2 &&
      history[0].assignmentId === initial.assignmentId &&
      history[0].status === "Ended" &&
      history[0].endDate === "2026-11-01" &&
      history[1].assignmentId === replacement.assignmentId &&
      history[1].status === "Active",
    "TC-BR-012",
    "Supervisor change ends the previous record and creates a new record without overwriting history",
  );
  assert(
    history.filter(
      (record) =>
        record.role === "MAIN" && record.status === "Active" && !record.endDate,
    ).length === 1,
    "TC-BR-043",
    "Only one open MAIN supervisor assignment remains after a change",
  );

  expectThrow(
    () =>
      service.endAssignment(
        "TH-001",
        replacement.assignmentId,
        {
          endDate: "2026-10-31",
          changeReason: "Invalid date test",
          approvedByUserId: pga.userId,
        },
        pga,
      ),
    "TC-BR-043",
    "Supervisor assignment rejects endDate earlier than startDate",
  );

  const loadResearcher = people.createOrUpdateResearcher({
    researcherId: "RES-LOAD",
    personId: "P-102",
    institutionId: "INST-001",
    status: "Active",
  });
  people.addResearcherAffiliation(loadResearcher.researcherId, {
    affiliationId: "AFF-RES-LOAD",
    institutionId: "INST-001",
    orgUnitId: "OU-CS",
    roleRank: "Professor",
    effectiveFrom: "2026-01-01",
    sourceSystem: "IHEPSRS_PROTOTYPE",
  });

  const loadAssignments = [];
  for (let index = 1; index <= 5; index += 1) {
    const thesisId = `TH-LOAD-${index}`;
    contexts.register({
      thesisId,
      institutionId: "INST-001",
      programId: "PRG-CS-MSC",
      studentPersonId: "P-103",
    });
    loadAssignments.push(
      service.assignSupervisor(
        thesisId,
        {
          researcherId: "RES-LOAD",
          role: "MAIN",
          startDate: "2026-12-01",
          approvedByUserId: pga.userId,
        },
        pga,
      ),
    );
  }
  contexts.register({
    thesisId: "TH-LOAD-6",
    institutionId: "INST-001",
    programId: "PRG-CS-MSC",
    studentPersonId: "P-103",
  });
  const overloaded = service.checkEligibility(
    "TH-LOAD-6",
    {
      researcherId: "RES-LOAD",
      role: "CO_SUPERVISOR",
      startDate: "2026-12-02",
    },
    pgo,
  );
  assert(
    !overloaded.eligible && overloaded.currentLoadPoints === 5,
    "TC-BR-044",
    "Active MAIN=1.0 and CO=0.5 load points enforce the default 5-point prototype limit",
  );

  institutions.createPolicyVersion(
    {
      policyKey: "THESIS_SUPERVISORY_LOAD_LIMIT",
      scopeType: "Program",
      scopeId: "PRG-CS-MSC",
      value: {
        defaultLimitPoints: 4,
        rankLimits: { Professor: 2 },
      },
      versionNo: 1,
      effectiveFrom: "2027-01-01",
      approvedByUserId: ua.userId,
      status: "Approved",
    },
    ua,
  );
  const historicalSnapshot = service.getPolicySnapshot(
    loadAssignments[0].assignmentId,
  );
  assert(
    historicalSnapshot?.loadLimitPoints === 5 &&
      loadAssignments.every((record) => record.status === "Active"),
    "TC-BR-044",
    "A later PolicyConfiguration does not retroactively rewrite existing supervisor assignments",
  );
  const rankPolicyEligibility = service.checkEligibility(
    "TH-LOAD-6",
    {
      researcherId: "RES-LOAD",
      role: "CO_SUPERVISOR",
      startDate: "2027-02-01",
    },
    pgo,
  );
  assert(
    !rankPolicyEligibility.eligible &&
      rankPolicyEligibility.limitPoints === 2 &&
      rankPolicyEligibility.roleRank === "Professor" &&
      rankPolicyEligibility.policyVersionNo === 1,
    "TC-BR-044",
    "Program PolicyConfiguration can apply a rank-specific supervision limit to new decisions",
  );

  contexts.register({
    thesisId: "TH-FUTURE",
    institutionId: "INST-001",
    programId: "PRG-CS-MSC",
    studentPersonId: "P-102",
  });
  service.assignSupervisor(
    "TH-FUTURE",
    {
      researcherId: "RES-102",
      role: "MAIN",
      startDate: "2028-01-01",
      approvedByUserId: pga.userId,
    },
    pga,
  );
  expectThrow(
    () =>
      service.assignSupervisor(
        "TH-FUTURE",
        {
          researcherId: "RES-101",
          role: "MAIN",
          startDate: "2027-06-01",
          approvedByUserId: pga.userId,
        },
        pga,
      ),
    "TC-BR-043",
    "MAIN supervisor effective periods cannot overlap a future MAIN assignment",
  );

  contexts.register({
    thesisId: "TH-ROLLBACK",
    institutionId: "INST-001",
    programId: "PRG-CS-MSC",
    studentPersonId: "P-102",
  });
  const rollbackInitial = service.assignSupervisor(
    "TH-ROLLBACK",
    {
      researcherId: "RES-101",
      role: "MAIN",
      startDate: "2026-10-01",
      approvedByUserId: pga.userId,
    },
    pga,
  );
  const originalAppend = thesisAudit.append.bind(thesisAudit);
  thesisAudit.append = () => {
    throw new Error("simulated audit persistence failure");
  };
  expectThrow(
    () =>
      service.assignSupervisor(
        "TH-ROLLBACK",
        {
          researcherId: "RES-102",
          role: "MAIN",
          startDate: "2026-12-01",
          changeReason: "Atomic rollback test",
          approvedByUserId: pga.userId,
        },
        pga,
      ),
    "TC-NFR-014",
    "Supervisor change fails atomically when the audit write fails",
  );
  thesisAudit.append = originalAppend;
  const rollbackHistory = service.listAssignments("TH-ROLLBACK", pgo);
  assert(
    rollbackHistory.length === 1 &&
      rollbackHistory[0].assignmentId === rollbackInitial.assignmentId &&
      rollbackHistory[0].status === "Active" &&
      !rollbackHistory[0].endDate,
    "TC-NFR-014",
    "Failed multi-record supervisor change restores the previous assignment state",
  );

  assert(
    service.verifyAuditChain(),
    "TC-NFR-011-TH002",
    "Supervisor assignment/change operations retain a correlation-aware tamper-evident prototype audit chain",
  );

  console.log("\nTASK-TH-002 supervisor assignment verification passed.");
}

main();
