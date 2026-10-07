const {
  ROLE_CATALOGUE,
  UNCODED_ROLE_CATALOGUE_ROWS,
  getRoleDefinition,
  isKnownRoleCode,
} = require("../dist/identity/domain/role-catalogue.js");
const {
  RoleAssignment,
} = require("../dist/identity/domain/role-assignment.js");

function assert(condition, sourceId, message) {
  if (!condition) {
    throw new Error(`${sourceId}: ${message}`);
  }
  console.log(`PASS ${sourceId}: ${message}`);
}

function expectThrow(fn, sourceId, message) {
  let thrown = false;
  try {
    fn();
  } catch {
    thrown = true;
  }
  assert(thrown, sourceId, message);
}

function main() {
  const expectedCodes = [
    "CGA",
    "IRS",
    "UA",
    "PGA",
    "PGO",
    "RA",
    "RO",
    "DS",
    "IO",
    "SA",
    "RC",
  ];

  assert(
    JSON.stringify(ROLE_CATALOGUE.map((role) => role.code)) ===
      JSON.stringify(expectedCodes),
    "TC-FR-003-IAM002",
    "Section 4.3 coded role catalogue is preserved exactly",
  );

  assert(
    getRoleDefinition("UA")?.scope === "Institution",
    "TC-BR-027-IAM002",
    "role catalogue preserves the approved scope descriptor",
  );

  assert(
    !isKnownRoleCode("SUPER_ADMIN"),
    "TC-NFR-008-IAM002",
    "unknown role codes fail closed instead of becoming implicit roles",
  );

  expectThrow(
    () =>
      new RoleAssignment({
        assignmentId: "assignment-unknown",
        userId: "user-001",
        roleCode: "SUPER_ADMIN",
        institutionId: "institution-001",
        validFrom: "2026-10-02T00:00:00Z",
        grantedBy: "user-security-admin",
      }),
    "TC-FR-003-IAM002",
    "RoleAssignment rejects a roleCode outside the approved catalogue",
  );

  const assignment = new RoleAssignment({
    assignmentId: "assignment-001",
    userId: "user-001",
    roleCode: "UA",
    institutionId: "institution-001",
    validFrom: "2026-10-02T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    grantedBy: "user-security-admin",
  });

  assert(
    assignment.roleCode === "UA" &&
      assignment.institutionId === "institution-001",
    "TC-BR-027-IAM002",
    "RoleAssignment retains role and institution scope references for IAM-003",
  );

  expectThrow(
    () =>
      new RoleAssignment({
        assignmentId: "assignment-bad-window",
        userId: "user-001",
        roleCode: "UA",
        institutionId: "institution-001",
        validFrom: "2026-12-31T23:59:59Z",
        validTo: "2026-10-02T00:00:00Z",
        grantedBy: "user-security-admin",
      }),
    "TC-FR-003-IAM002",
    "RoleAssignment rejects an inverted validity interval",
  );

  assert(
    UNCODED_ROLE_CATALOGUE_ROWS.length === 3,
    "TC-FR-003-IAM002-SOURCE-GAP",
    "uncoded Section 4.3 rows are preserved without fabricated roleCode values",
  );

  console.log("");
  console.log("IAM-002 role catalogue check passed.");
  console.log(
    "NOTE BR-028/UC-24 delegation enforcement remains owned by TASK-IAM-004.",
  );
  console.log(
    "NOTE full request authorization remains owned by TASK-IAM-003/IAM-005.",
  );
  console.log(
    "NOTE NFR-011 audit persistence/tamper evidence is not falsely claimed by this read-only catalogue task.",
  );
}

main();
