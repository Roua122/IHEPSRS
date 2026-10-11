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

function main() {
  console.log("=== Verification: Phase 03 Institutions 001-004 ===");
  const authorization = new InstitutionAuthorizationService(
    new AuthorizationDecisionService(),
  );
  const audit = new PrototypeAuditService();
  const service = new InstitutionsService(authorization, audit);

  const cga = principal("U-CGA", "CGA", null);
  const irs = principal("U-IRS", "IRS", null);
  const uaA = principal("U-UA-A", "UA", "INST-001");
  const uaB = principal("U-UA-B", "UA", "INST-002");

  const instA = service.createInstitution(
    {
      institutionId: "INST-001",
      code: "U-A",
      nameAr: "جامعة ألف",
      nameEn: "University A",
      type: "University",
      status: "Active",
      externalRefs: { sis: "A-SIS" },
    },
    cga,
  );
  assert(
    instA.code === "U-A" && instA.nameAr === "جامعة ألف",
    "TC-FR-004",
    "Institution registry preserves canonical Institution fields",
  );

  service.createInstitution(
    {
      institutionId: "INST-002",
      code: "U-B",
      nameAr: "جامعة باء",
      type: "University",
      status: "Active",
    },
    irs,
  );
  assert(
    service.listInstitutions(cga).length === 2,
    "TC-NFR-007",
    "A new Institution is added through registry data without changing core modules",
  );
  expectThrow(
    () =>
      service.createInstitution(
        {
          institutionId: "INST-UA-DENIED",
          code: "UA-X",
          nameAr: "غير مسموح",
          type: "University",
          status: "Active",
        },
        uaA,
      ),
    "TC-NFR-008-INS",
    "University Admin cannot create cross-institution registry roots",
  );

  const renamed = service.updateInstitution(
    "INST-001",
    { nameAr: "جامعة ألف المحدثة" },
    uaA,
  );
  assert(
    renamed.nameAr === "جامعة ألف المحدثة",
    "TC-BR-033",
    "Scoped master-data change succeeds for the owning Institution",
  );
  expectThrow(
    () =>
      service.updateInstitution("INST-001", { nameAr: "Cross tenant" }, uaB),
    "TC-NFR-008-INS",
    "Cross-institution master-data write is denied",
  );

  service.createOrgUnit(
    "INST-001",
    {
      orgUnitId: "OU-COLLEGE",
      type: "College",
      nameAr: "كلية الحاسوب",
      status: "Active",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2030-01-01",
    },
    uaA,
  );
  service.createOrgUnit(
    "INST-001",
    {
      orgUnitId: "OU-CS",
      parentOrgUnitId: "OU-COLLEGE",
      type: "Department",
      nameAr: "قسم علوم الحاسوب",
      status: "Active",
      effectiveFrom: "2026-02-01",
      effectiveTo: "2029-12-31",
    },
    uaA,
  );
  assert(
    service.listOrgUnits("INST-001", uaA).length === 2,
    "TC-FR-005",
    "Organizational units are linked to the scoped Institution",
  );
  expectThrow(
    () =>
      service.createOrgUnit(
        "INST-001",
        {
          orgUnitId: "OU-INVALID",
          parentOrgUnitId: "OU-COLLEGE",
          type: "Department",
          nameAr: "قسم خارج المدة",
          status: "Active",
          effectiveFrom: "2029-01-01",
          effectiveTo: "2031-01-01",
        },
        uaA,
      ),
    "TC-BR-002",
    "Child OrgUnit cannot outlive its valid parent window",
  );

  const programV1 = service.createProgramVersion(
    "INST-001",
    {
      programId: "PRG-CS-MSC",
      orgUnitId: "OU-CS",
      degreeLevel: "Master",
      nameAr: "ماجستير علوم الحاسوب",
      specializationCode: "CS",
      status: "Active",
      effectiveFrom: "2026-02-01",
      effectiveTo: "2027-01-01",
      thesisRequired: true,
      versionNo: 1,
    },
    uaA,
  );
  assert(
    programV1.versionNo === 1 && programV1.thesisRequired,
    "TC-FR-006",
    "AcademicProgram canonical fields and first version are stored",
  );
  assert(
    service.assertProgramEligible("PRG-CS-MSC", "2026-10-01").versionNo === 1,
    "TC-BR-003",
    "Enrollment eligibility resolves the Active program version at event date",
  );

  service.createProgramVersion(
    "INST-001",
    {
      programId: "PRG-CS-MSC",
      orgUnitId: "OU-CS",
      degreeLevel: "Master",
      nameAr: "ماجستير علوم الحاسوب - نسخة 2",
      specializationCode: "CS",
      status: "Active",
      effectiveFrom: "2027-01-01",
      effectiveTo: "2029-12-30",
      thesisRequired: true,
      versionNo: 2,
    },
    uaA,
  );
  assert(
    service.assertProgramEligible("PRG-CS-MSC", "2026-10-01").versionNo === 1 &&
      service.assertProgramEligible("PRG-CS-MSC", "2027-02-01").versionNo === 2,
    "TC-BR-042",
    "Program version update preserves historical effective-date resolution",
  );

  service.createReferenceVersion(
    {
      referenceType: "DegreeLevel",
      code: "MSC",
      label: "ماجستير",
      versionNo: 1,
      effectiveFrom: "2026-01-01",
    },
    irs,
  );
  service.createReferenceVersion(
    {
      referenceType: "DegreeLevel",
      code: "MSC",
      label: "ماجستير أكاديمي",
      versionNo: 2,
      effectiveFrom: "2027-01-01",
    },
    irs,
  );
  assert(
    service.resolveReferenceAt("DegreeLevel", "MSC", "2026-06-01").versionNo ===
      1 &&
      service.resolveReferenceAt("DegreeLevel", "MSC", "2027-06-01")
        .versionNo === 2,
    "TC-BR-038",
    "Reference-data changes do not rewrite historical decisions",
  );
  service.retireReference("DegreeLevel", "MSC", "2028-01-01", irs);
  assert(
    service.resolveReferenceAt("DegreeLevel", "MSC", "2027-06-01").versionNo ===
      2,
    "TC-BR-039",
    "Retiring a used reference preserves its historical version instead of deleting it",
  );

  const policyV1 = service.createPolicyVersion(
    {
      policyKey: "study.maxDurationMonths",
      scopeType: "Program",
      scopeId: "PRG-CS-MSC",
      value: { months: 36 },
      versionNo: 1,
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      approvedByUserId: uaA.userId,
      status: "Approved",
    },
    uaA,
  );
  service.createPolicyVersion(
    {
      policyKey: "study.maxDurationMonths",
      scopeType: "Program",
      scopeId: "PRG-CS-MSC",
      value: { months: 42 },
      versionNo: 2,
      effectiveFrom: "2027-01-01T00:00:00.000Z",
      approvedByUserId: uaA.userId,
      status: "Approved",
    },
    uaA,
  );
  assert(
    service.resolvePolicyAt(
      "study.maxDurationMonths",
      "Program",
      "PRG-CS-MSC",
      "2026-06-01T00:00:00.000Z",
    ).policyId === policyV1.policyId &&
      service.resolvePolicyAt(
        "study.maxDurationMonths",
        "Program",
        "PRG-CS-MSC",
        "2027-06-01T00:00:00.000Z",
      ).versionNo === 2,
    "TC-BR-062",
    "PolicyConfiguration is versioned/effective-dated without retroactive replacement",
  );
  expectThrow(
    () =>
      service.createPolicyVersion(
        {
          policyKey: "study.maxDurationMonths",
          scopeType: "Program",
          scopeId: "PRG-CS-MSC",
          value: { months: 48 },
          versionNo: 3,
          effectiveFrom: "2028-01-01T00:00:00.000Z",
          approvedByUserId: "SPOOFED-USER",
          status: "Approved",
        },
        uaA,
      ),
    "TC-FR-043",
    "Policy approval identity cannot be spoofed from the request body",
  );

  const auditCountBeforeFailure = service.listAudit(cga).length;
  const originalAppend = audit.append.bind(audit);
  audit.append = () => {
    throw new Error("simulated audit persistence failure");
  };
  expectThrow(
    () =>
      service.createInstitution(
        {
          institutionId: "INST-ROLLBACK",
          code: "ROLLBACK",
          nameAr: "يجب التراجع عنها",
          type: "University",
          status: "Active",
        },
        cga,
      ),
    "TC-NFR-014",
    "Multi-record master-data operation fails atomically when audit persistence fails",
  );
  audit.append = originalAppend;
  assert(
    !service
      .listInstitutions(cga)
      .some((item) => item.institutionId === "INST-ROLLBACK") &&
      service.listAudit(cga).length === auditCountBeforeFailure,
    "TC-NFR-014",
    "Failed operation leaves neither partial Institution state nor partial Audit state",
  );

  const archived = service.archiveInstitution("INST-002", cga);
  assert(
    archived.status === "Archived",
    "TC-FR-004",
    "Institution can be archived without deleting history",
  );
  expectThrow(
    () =>
      service.createInstitution(
        {
          institutionId: "INST-002",
          code: "U-B2",
          nameAr: "إعادة استخدام ممنوعة",
          type: "University",
          status: "Active",
        },
        cga,
      ),
    "TC-BR-001",
    "Archived institutionId cannot be reused",
  );

  assert(
    service.verifyAuditChain(),
    "TC-BR-033",
    "Sensitive master-data changes produce a correlation-aware tamper-evident prototype audit chain",
  );

  console.log("\nPhase 03 Institutions verification passed.");
}

main();
