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
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  AcademicAuditService,
} = require("../dist/postgraduate/domain/academic-audit.service.js");
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
const {
  ThesisEntityService,
} = require("../dist/thesis/domain/thesis-entity.service.js");
const {
  IntegratedThesisSupervisorGateway,
} = require("../dist/thesis/domain/thesis-supervisor.integration.gateway.js");
function assert(condition, testId, message) {
  if (!condition) {
    throw new Error(`${testId}: ${message}`);
  }
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
function principal(userId, roleCode, institutionId, personId) {
  return {
    userId,
    ...(personId ? { personId } : {}),
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
  return { decisions, institutions };
}
async function main() {
  console.log("=== Verification: TH001 <-> TH002 supervisor integration ===");
  const { decisions, institutions } = setupInstitutions();
  const people = new PersonIdentityService();
  const contexts = new ThesisSupervisionContextService();
  const thesisAuthorization = new ThesisAuthorizationService(decisions);
  const supervisorAudit = new PrototypeAuditService();
  const supervisors = new ThesisSupervisorService(
    contexts,
    people,
    institutions,
    thesisAuthorization,
    supervisorAudit,
  );
  const enrollmentRecords = new Map([
    [
      "ENR-TH-INT-001",
      {
        enrollmentId: "ENR-TH-INT-001",
        studentId: "STU-TH-INT-001",
        personId: "P-102",
        institutionId: "INST-001",
        programId: "PRG-CS-MSC",
        applicationId: "APP-TH-INT-001",
        admissionCycleId: "CYCLE-2026",
        status: "Active",
      },
    ],
    [
      "ENR-TH-INT-ROLLBACK",
      {
        enrollmentId: "ENR-TH-INT-ROLLBACK",
        studentId: "STU-TH-INT-ROLLBACK",
        personId: "P-102",
        institutionId: "INST-001",
        programId: "PRG-CS-MSC",
        applicationId: "APP-TH-INT-ROLLBACK",
        admissionCycleId: "CYCLE-2026",
        status: "Active",
      },
    ],
    [
      "ENR-TH-INT-AUDIT-FAILURE",
      {
        enrollmentId: "ENR-TH-INT-AUDIT-FAILURE",
        studentId: "STU-TH-INT-AUDIT-FAILURE",
        personId: "P-102",
        institutionId: "INST-001",
        programId: "PRG-CS-MSC",
        applicationId: "APP-TH-INT-AUDIT-FAILURE",
        admissionCycleId: "CYCLE-2026",
        status: "Active",
      },
    ],
  ]);
  const enrollmentService = {
    getOne(enrollmentId) {
      const record = enrollmentRecords.get(enrollmentId);
      if (!record) {
        throw new Error(`Enrollment ${enrollmentId} not found`);
      }
      return { ...record };
    },
    getForIntegration(enrollmentId) {
      const record = enrollmentRecords.get(enrollmentId);
      if (!record) {
        throw new Error(`Enrollment ${enrollmentId} not found`);
      }
      return { ...record };
    },
  };
  const references = {
    getProgram(programId) {
      if (programId !== "PRG-CS-MSC") {
        throw new Error(`Program ${programId} not found`);
      }
      return {
        programId,
        institutionId: "INST-001",
        orgUnitId: "OU-CS",
      };
    },
  };
  const academicAuthorization = {
    assertOfficer() {},
  };
  const academicHistory = [];
  const academicAudit = {
    transition(input) {
      const entry = {
        statusHistoryId: `H-${academicHistory.length + 1}`,
        entityType: input.entityType,
        entityId: input.entityId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        changedAt: new Date().toISOString(),
        changedByUserId: input.actorUserId,
        reasonCode: input.reasonCode,
      };
      academicHistory.push(entry);
      return { ...entry };
    },
    record() {},
    history(entityType, entityId) {
      return academicHistory
        .filter(
          (entry) =>
            entry.entityType === entityType && entry.entityId === entityId,
        )
        .map((entry) => ({ ...entry }));
    },
  };
  const theses = new ThesisEntityService(
    enrollmentService,
    references,
    people,
    academicAuthorization,
    academicAudit,
    {},
    {},
    {},
    contexts,
  );
  const pga = principal("U-PGA", "PGA", "INST-001");
  const pgo = principal("U-PGO", "PGO", "INST-001");
  const draft = theses.createDraft(
    {
      enrollmentId: "ENR-TH-INT-001",
      titleAr: "اختبار تكامل الرسالة والإشراف",
    },
    pga,
  );
  assert(
    draft.status === "Draft",
    "TC-TH-INT-001",
    "New Thesis starts in Draft state",
  );
  expectThrow(
    () => contexts.get(draft.thesisId),
    "TC-TH-INT-002",
    "Draft Thesis does not expose a TH-002 supervision context",
  );
  const registered = theses.register(draft.thesisId, pga);
  assert(
    registered.status === "Registered",
    "TC-TH-INT-003",
    "TH-001 registration moves Draft to Registered",
  );
  const registeredContext = contexts.get(draft.thesisId);
  assert(
    registeredContext.institutionId === "INST-001" &&
      registeredContext.programId === "PRG-CS-MSC" &&
      registeredContext.studentPersonId === "P-102",
    "TC-TH-INT-004",
    "Registered Thesis creates the canonical TH-002 supervision context",
  );
  const assignment = supervisors.assignSupervisor(
    draft.thesisId,
    {
      researcherId: "RES-101",
      role: "MAIN",
      startDate: "2026-10-01",
      approvedByUserId: pga.userId,
    },
    pga,
    () => {
      theses.recordMainSupervisorAssigned(draft.thesisId, pga);
    },
  );
  assert(
    assignment.status === "Active" && assignment.role === "MAIN",
    "TC-TH-INT-005",
    "TH-002 creates the approved active MAIN assignment",
  );
  const assignedThesis = theses.getOne(draft.thesisId, pga);
  assert(
    assignedThesis.status === "SupervisorAssigned",
    "TC-TH-INT-006",
    "Successful MAIN assignment advances Registered to SupervisorAssigned",
  );
  const gateway = new IntegratedThesisSupervisorGateway(
    supervisors,
    contexts,
    enrollmentService,
  );
  const activeEvidence = await gateway.assertActiveMainSupervisor(
    draft.thesisId,
    "ENR-TH-INT-001",
  );
  assert(
    activeEvidence.thesisId === draft.thesisId &&
      activeEvidence.enrollmentId === "ENR-TH-INT-001" &&
      activeEvidence.assignmentId === assignment.assignmentId,
    "TC-TH-INT-007",
    "TH-003/TH-004 gateway resolves trusted active MAIN supervisor evidence",
  );
  const supervisorPersonId = people.getResearcher("RES-101").personId;
  const supervisorPrincipal = {
    userId: "U-SUPERVISOR-101",
    personId: supervisorPersonId,
    authenticated: true,
    roleAssignments: [],
  };
  const assignedEvidence = await gateway.assertAssignedMainSupervisor(
    draft.thesisId,
    "ENR-TH-INT-001",
    supervisorPrincipal,
  );
  assert(
    assignedEvidence.assignmentId === assignment.assignmentId,
    "TC-TH-INT-008",
    "Authenticated assigned MAIN supervisor identity is accepted by the integration gateway",
  );
  const rollbackDraft = theses.createDraft(
    {
      enrollmentId: "ENR-TH-INT-ROLLBACK",
      titleAr: "اختبار التراجع الذري",
    },
    pga,
  );
  expectThrow(
    () => contexts.get(rollbackDraft.thesisId),
    "TC-TH-INT-009",
    "Draft rollback fixture initially has no supervision context",
  );
  // Force only the TH-002 prerequisite so we can verify that a failing
  // TH-001 transition causes the TH-002 assignment transaction to roll back.
  contexts.register({
    thesisId: rollbackDraft.thesisId,
    institutionId: "INST-001",
    programId: "PRG-CS-MSC",
    studentPersonId: "P-102",
  });
  expectThrow(
    () =>
      supervisors.assignSupervisor(
        rollbackDraft.thesisId,
        {
          researcherId: "RES-102",
          role: "MAIN",
          startDate: "2026-10-20",
          approvedByUserId: pga.userId,
        },
        pga,
        () => {
          theses.recordMainSupervisorAssigned(rollbackDraft.thesisId, pga);
        },
      ),
    "TC-TH-INT-010",
    "MAIN assignment fails when the Thesis state transition rejects Draft",
  );
  const rollbackAssignments = supervisors.listAssignments(
    rollbackDraft.thesisId,
    pgo,
  );
  assert(
    rollbackAssignments.length === 0,
    "TC-TH-INT-011",
    "Failed TH-001 state transition rolls back the TH-002 assignment",
  );
  const rollbackThesis = theses.getOne(rollbackDraft.thesisId, pga);
  assert(
    rollbackThesis.status === "Draft",
    "TC-TH-INT-012",
    "Failed integrated assignment leaves the Thesis state unchanged",
  );
  assert(
    supervisors.verifyAuditChain(),
    "TC-TH-INT-013",
    "Integrated supervisor flow preserves the TH-002 audit chain",
  );

  const atomicResearchAudit = new ResearchAuditService();
  const atomicAcademicAudit = new AcademicAuditService(atomicResearchAudit);

  const atomicTheses = new ThesisEntityService(
    enrollmentService,
    references,
    people,
    academicAuthorization,
    atomicAcademicAudit,
    {},
    {},
    {},
    contexts,
  );

  const auditFailureDraft = atomicTheses.createDraft(
    {
      enrollmentId: "ENR-TH-INT-AUDIT-FAILURE",
      titleAr: "اختبار فشل سجل التدقيق",
    },
    pga,
  );

  const auditFailureRegistered = atomicTheses.register(
    auditFailureDraft.thesisId,
    pga,
  );

  assert(
    auditFailureRegistered.status === "Registered",
    "TC-TH-INT-014",
    "Academic-audit failure fixture reaches Registered before MAIN assignment",
  );

  const statusHistoryBeforeFailure = atomicAcademicAudit.history(
    "Thesis",
    auditFailureDraft.thesisId,
  ).length;

  const academicAuditCountBeforeFailure = atomicResearchAudit.list().length;
  const supervisorAuditCountBeforeFailure = supervisorAudit.list().length;

  const originalAcademicAppend =
    atomicResearchAudit.append.bind(atomicResearchAudit);

  atomicResearchAudit.append = (input) => {
    if (input.metadata?.sourceId === "FR-014/BR-011/UC-06") {
      throw new Error("simulated academic audit persistence failure");
    }

    return originalAcademicAppend(input);
  };

  try {
    expectThrow(
      () =>
        supervisors.assignSupervisor(
          auditFailureDraft.thesisId,
          {
            researcherId: "RES-102",
            role: "MAIN",
            startDate: "2026-10-01",
            approvedByUserId: pga.userId,
          },
          pga,
          () => {
            atomicTheses.recordMainSupervisorAssigned(
              auditFailureDraft.thesisId,
              pga,
            );
          },
        ),
      "TC-TH-INT-015",
      "Academic audit persistence failure aborts integrated MAIN assignment",
    );
  } finally {
    atomicResearchAudit.append = originalAcademicAppend;
  }

  const auditFailureAssignments = supervisors.listAssignments(
    auditFailureDraft.thesisId,
    pgo,
  );

  assert(
    auditFailureAssignments.length === 0,
    "TC-TH-INT-016",
    "Academic audit failure rolls back the TH-002 supervisor assignment",
  );

  const thesisAfterAuditFailure = atomicTheses.getOne(
    auditFailureDraft.thesisId,
    pga,
  );

  assert(
    thesisAfterAuditFailure.status === "Registered",
    "TC-TH-INT-017",
    "Academic audit failure leaves Thesis state at Registered",
  );

  const statusHistoryAfterFailure = atomicAcademicAudit.history(
    "Thesis",
    auditFailureDraft.thesisId,
  );

  assert(
    statusHistoryAfterFailure.length === statusHistoryBeforeFailure &&
      !statusHistoryAfterFailure.some(
        (entry) => entry.toStatus === "SupervisorAssigned",
      ),
    "TC-TH-INT-018",
    "Academic audit failure leaves no partial SupervisorAssigned StatusHistory",
  );

  assert(
    atomicResearchAudit.list().length === academicAuditCountBeforeFailure,
    "TC-TH-INT-019",
    "Failed Academic Audit append leaves no partial hash-chain audit entry",
  );

  assert(
    supervisorAudit.list().length === supervisorAuditCountBeforeFailure,
    "TC-TH-INT-020",
    "TH-002 transaction rolls back its audit entry when TH-001 audit fails",
  );

  assert(
    supervisors.verifyAuditChain(),
    "TC-TH-INT-021",
    "Audit failure rollback preserves the TH-002 tamper-evident audit chain",
  );

  console.log("\nTH001 <-> TH002 supervisor integration verification passed.");
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
