/**
 * Focused PG <-> INS canonical-registry integration regression (Stage 7).
 * Run after building @ihepsrs/api. Uses compiled services, not duplicate
 * Postgraduate program fixtures or client-supplied Program status.
 * A pass is NOT full PG002-PG005 acceptance or database/HTTP E2E evidence.
 */
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

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
  AcademicReferenceService,
} = require("../dist/postgraduate/domain/academic-reference.service.js");
const {
  AcademicAuthorizationService,
} = require("../dist/postgraduate/domain/academic-authorization.service.js");
const {
  AcademicAuditService,
} = require("../dist/postgraduate/domain/academic-audit.service.js");
const {
  ApplicantService,
} = require("../dist/postgraduate/domain/applicant.service.js");
const {
  AdmissionDecisionEvidenceService,
} = require("../dist/postgraduate/domain/admission-decision-evidence.service.js");
const {
  ApplicationWorkflowService,
} = require("../dist/postgraduate/domain/application-workflow.service.js");
const {
  ApplicationNotificationOutboxService,
} = require("../dist/postgraduate/domain/application-notification-outbox.service.js");
const {
  UnavailableApplicationDocumentGateway,
} = require("../dist/postgraduate/domain/application-document.gateway.js");
const {
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  BusinessPolicyService,
} = require("../dist/config/business-policy.service.js");

let checks = 0;

async function check(id, description, operation) {
  try {
    await operation();
    checks += 1;
    console.log(`PASS ${id}: ${description}`);
  } catch (error) {
    console.error(`FAIL ${id}: ${description}`);
    throw error;
  }
}

function principal(userId, roleCode, institutionId = null) {
  return {
    userId,
    personId: userId,
    authenticated: true,
    roleAssignments: roleCode
      ? [
          {
            assignmentId: `ASG-${userId}`,
            roleCode,
            institutionId,
            validFrom: "2026-01-01T00:00:00.000Z",
            validTo: null,
          },
        ]
      : [],
  };
}

function createProgram(service, institutionId, unitId, actor, options = {}) {
  return service.createProgramVersion(
    institutionId,
    {
      programId: "PROGRAM-DEMO-001",
      orgUnitId: unitId,
      degreeLevel: "Master",
      nameAr: "برنامج ماجستير تجريبي",
      status: "Active",
      effectiveFrom: "2026-01-01",
      thesisRequired: true,
      versionNo: 1,
      ...options,
    },
    actor,
  );
}

async function main() {
  const decisions = new AuthorizationDecisionService();
  const registryAudit = new PrototypeAuditService();
  const institutions = new InstitutionsService(
    new InstitutionAuthorizationService(decisions),
    registryAudit,
  );
  const references = new AcademicReferenceService(institutions);
  const central = principal("STAGE7-CENTRAL", "CGA");
  const adminA = principal("STAGE7-A", "UA", "INST-001");
  const adminB = principal("STAGE7-B", "UA", "INST-002");
  const applicant = principal("STAGE7-APPLICANT", null);

  institutions.createInstitution(
    {
      institutionId: "INST-001",
      code: "A",
      nameAr: "جامعة أ",
      type: "University",
      status: "Active",
    },
    central,
  );
  institutions.createInstitution(
    {
      institutionId: "INST-002",
      code: "B",
      nameAr: "جامعة ب",
      type: "University",
      status: "Active",
    },
    central,
  );
  for (const [inst, unit, actor] of [
    ["INST-001", "OU-A", adminA],
    ["INST-002", "OU-B", adminB],
  ]) {
    institutions.createOrgUnit(
      inst,
      {
        orgUnitId: unit,
        type: "College",
        nameAr: `وحدة ${unit}`,
        status: "Active",
        effectiveFrom: "2026-01-01",
      },
      actor,
    );
  }
  createProgram(institutions, "INST-001", "OU-A", adminA);

  await check(
    "TC-FR-006/BR-003",
    "PG reads canonical INS program ownership and eligibility",
    () => {
      const pg = references.assertProgramEffective(
        "PROGRAM-DEMO-001",
        "2026-10-11",
      );
      assert.equal(pg.institutionId, "INST-001");
      assert.equal(pg.orgUnitId, "OU-A");
      assert.equal(pg.versionNo, 1);
      assert.equal(pg.thesisRequired, true);
    },
  );

  const persons = new PersonIdentityService();
  const academicAuth = new AcademicAuthorizationService(decisions);
  const academicAudit = new AcademicAuditService(new ResearchAuditService());
  const applicants = new ApplicantService(persons, academicAuth, academicAudit);
  const notifications = new ApplicationNotificationOutboxService();
  const workflows = new ApplicationWorkflowService(
    applicants,
    persons,
    references,
    academicAuth,
    academicAudit,
    new UnavailableApplicationDocumentGateway(),
    notifications,
    new BusinessPolicyService({
      get: () => path.join(__dirname, "../config/policies.json"),
    }),
    new AdmissionDecisionEvidenceService(references, persons),
  );

  await check(
    "TC-FR-010/BR-006",
    "Real PG application uses trusted INS institution and program version",
    async () => {
      applicants.registerSelf({ fullNameAr: "متقدم للتكامل" }, applicant);
      const draft = workflows.createDraft(
        {
          programId: "PROGRAM-DEMO-001",
          admissionCycleId: "CYCLE-DEMO-2026",
        },
        applicant,
      );
      assert.equal(draft.institutionId, "INST-001");
      const submitted = await workflows.submitDraft(
        draft.applicationId,
        applicant,
      );
      assert.equal(submitted.status, "Submitted");
      assert.equal(submitted.submissions[0].programVersionNo, 1);
      assert.equal(
        notifications.pendingForDelivery()[0].deliveryStatus,
        "Pending",
      );
    },
  );

  await check(
    "TC-BR-002/NFR-008",
    "An INS program ID cannot be moved to a different Institution",
    () => {
      const auditBefore = registryAudit.snapshotLength();
      assert.throws(
        () =>
          createProgram(institutions, "INST-002", "OU-B", adminB, {
            versionNo: 2,
            effectiveFrom: "2027-01-01",
          }),
        (error) => error.code === "CONFLICT",
      );
      assert.equal(
        institutions.getLatestProgramForIntegration("PROGRAM-DEMO-001")
          .institutionId,
        "INST-001",
      );
      assert.equal(
        institutions.listProgramVersions("PROGRAM-DEMO-001", adminA).length,
        1,
      );
      assert.equal(registryAudit.snapshotLength(), auditBefore);
    },
  );

  await check(
    "TC-BR-002/BR-062",
    "Padded program identifiers preserve canonical version history",
    () => {
      const next = createProgram(institutions, "INST-001", "OU-A", adminA, {
        programId: " PROGRAM-DEMO-001 ",
        versionNo: 2,
        effectiveFrom: "2027-01-01",
      });
      assert.equal(next.programId, "PROGRAM-DEMO-001");
      assert.equal(
        institutions.listProgramVersions("PROGRAM-DEMO-001", adminA).length,
        2,
      );
      assert.equal(references.getProgram("PROGRAM-DEMO-001").versionNo, 2);
      assert.equal(
        references.assertProgramEffective("PROGRAM-DEMO-001", "2026-10-11")
          .versionNo,
        1,
      );
      assert.equal(
        references.assertProgramEffective("PROGRAM-DEMO-001", "2027-02-01")
          .versionNo,
        2,
      );
    },
  );

  await check(
    "TC-BR-002",
    "Padded OrgUnit ID cannot overwrite another unit",
    () => {
      const auditBefore = registryAudit.snapshotLength();
      assert.throws(
        () =>
          institutions.createOrgUnit(
            "INST-002",
            {
              orgUnitId: " OU-A ",
              type: "College",
              nameAr: "استبدال غير مصرح",
              status: "Active",
              effectiveFrom: "2026-01-01",
            },
            adminB,
          ),
        (error) => error.code === "CONFLICT",
      );
      assert.equal(
        institutions.listOrgUnits("INST-001", adminA)[0].orgUnitId,
        "OU-A",
      );
      assert.equal(registryAudit.snapshotLength(), auditBefore);
    },
  );

  await check(
    "TC-BR-003",
    "PG eligibility follows canonical Institution deactivation",
    () => {
      institutions.changeInstitutionStatus(
        "INST-001",
        { status: "Inactive" },
        central,
      );
      assert.equal(
        references.isProgramEffective("PROGRAM-DEMO-001", "2026-10-11"),
        false,
      );
      institutions.changeInstitutionStatus(
        "INST-001",
        { status: "Active" },
        central,
      );
      assert.equal(
        references.isProgramEffective("PROGRAM-DEMO-001", "2026-10-11"),
        true,
      );
    },
  );

  await check(
    "TC-BR-006/FR-029",
    "Unconfigured application document requirements fail closed",
    () => {
      createProgram(institutions, "INST-002", "OU-B", adminB, {
        programId: "PROGRAM-OTHER-001",
      });
      assert.throws(
        () =>
          references.getRequiredApplicationDocumentPurposes(
            "PROGRAM-OTHER-001",
          ),
        (error) =>
          error.code === "SERVICE_UNAVAILABLE" && error.getStatus() === 503,
      );
      assert.throws(
        () =>
          workflows.createDraft(
            {
              programId: "PROGRAM-OTHER-001",
              admissionCycleId: "CYCLE-DEMO-2026",
            },
            applicant,
          ),
        (error) => error.code === "CONFLICT",
      );
    },
  );

  assert.equal(registryAudit.verifyChain(), true);
  console.log(
    `STAGE 7 FOCUSED PG <-> INSTITUTIONS INTEGRATION PASSED (${checks} checks)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
