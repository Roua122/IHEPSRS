const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");

function assert(condition, sourceId, message) {
  if (!condition) {
    throw new Error(`${sourceId}: ${message}`);
  }
  console.log(`PASS ${sourceId}: ${message}`);
}

function decision(service, principal, request, policy) {
  return service.evaluate(principal, request, policy);
}

function main() {
  const service = new AuthorizationDecisionService();
  const at = "2026-10-02T12:00:00Z";

  const ownInstitutionPolicy = {
    policyId: "IAM003-UA-INSTITUTION-READ",
    resource: "StudentRecord",
    action: "read",
    allowedRoleCodes: ["UA"],
    institutionScope: "RESOURCE_INSTITUTION",
    dataScope: "NOT_APPLICABLE",
    recordState: { mode: "ANY" },
  };

  const universityAdminA = {
    userId: "user-a",
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: "assignment-ua-a",
        roleCode: "UA",
        institutionId: "institution-a",
        validFrom: "2026-01-01T00:00:00Z",
        validTo: null,
      },
    ],
  };

  const own = decision(
    service,
    universityAdminA,
    {
      resource: "StudentRecord",
      action: "read",
      institutionId: "institution-a",
      at,
    },
    ownInstitutionPolicy,
  );
  assert(
    own.allowed && own.matchedRoleCode === "UA",
    "TC-FR-003-IAM003",
    "an active approved role can authorize the declared action inside its institution scope",
  );

  const crossTenant = decision(
    service,
    universityAdminA,
    {
      resource: "StudentRecord",
      action: "read",
      institutionId: "institution-b",
      at,
    },
    ownInstitutionPolicy,
  );
  assert(
    !crossTenant.allowed && crossTenant.reason === "INSTITUTION_SCOPE_MISMATCH",
    "TC-BR-027-IAM003 / UC-13",
    "University Admin for institution A is denied access to institution B",
  );

  const centralPrincipal = {
    userId: "central-user",
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: "assignment-cga",
        roleCode: "CGA",
        institutionId: null,
        validFrom: "2026-01-01T00:00:00Z",
        validTo: null,
      },
    ],
  };
  const centralPolicy = {
    ...ownInstitutionPolicy,
    policyId: "IAM003-CGA-CROSS-INSTITUTION-READ",
    allowedRoleCodes: ["CGA"],
  };
  const central = decision(
    service,
    centralPrincipal,
    {
      resource: "StudentRecord",
      action: "read",
      institutionId: "institution-b",
      at,
    },
    centralPolicy,
  );
  assert(
    central.allowed,
    "TC-BR-027-IAM003",
    "a role whose approved catalogue scope is Cross-Institution can satisfy an institution-scoped policy from a central assignment",
  );

  const noPrincipal = decision(
    service,
    undefined,
    {
      resource: "StudentRecord",
      action: "read",
      institutionId: "institution-a",
      at,
    },
    ownInstitutionPolicy,
  );
  assert(
    !noPrincipal.allowed && noPrincipal.reason === "UNAUTHENTICATED",
    "TC-NFR-008-IAM003",
    "missing authenticated principal fails closed",
  );

  const wrongAction = decision(
    service,
    universityAdminA,
    {
      resource: "StudentRecord",
      action: "write",
      institutionId: "institution-a",
      at,
    },
    ownInstitutionPolicy,
  );
  assert(
    !wrongAction.allowed && wrongAction.reason === "POLICY_MISMATCH",
    "TC-NFR-008-IAM003",
    "resource/action mismatch is denied instead of falling through",
  );

  const unknownRole = decision(
    service,
    {
      userId: "unknown-role-user",
      authenticated: true,
      roleAssignments: [
        {
          assignmentId: "assignment-unknown",
          roleCode: "SUPER_ADMIN",
          institutionId: null,
          validFrom: "2026-01-01T00:00:00Z",
          validTo: null,
        },
      ],
    },
    {
      resource: "StudentRecord",
      action: "read",
      institutionId: "institution-a",
      at,
    },
    ownInstitutionPolicy,
  );
  assert(
    !unknownRole.allowed && unknownRole.reason === "NO_ALLOWED_ROLE",
    "TC-NFR-008-IAM003",
    "unknown role codes do not become implicit privileges",
  );

  const expiredPrincipal = {
    userId: "expired-user",
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: "assignment-ua-expired",
        roleCode: "UA",
        institutionId: "institution-a",
        validFrom: "2026-01-01T00:00:00Z",
        validTo: "2026-09-01T00:00:00Z",
      },
    ],
  };
  const expired = decision(
    service,
    expiredPrincipal,
    {
      resource: "StudentRecord",
      action: "read",
      institutionId: "institution-a",
      at,
    },
    ownInstitutionPolicy,
  );
  assert(
    !expired.allowed && expired.reason === "ROLE_ASSIGNMENT_NOT_ACTIVE",
    "TC-FR-003-IAM003",
    "expired role assignments cannot authorize requests",
  );

  const scopedPolicy = {
    policyId: "IAM003-DATA-SCOPE-READ",
    resource: "AssignedCase",
    action: "read",
    allowedRoleCodes: ["DS"],
    institutionScope: "NOT_APPLICABLE",
    dataScope: "MATCH_REQUIRED",
    recordState: { mode: "ALLOWED", states: ["Open", "UnderReview"] },
  };
  const scopedPrincipal = {
    userId: "data-steward",
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: "assignment-ds",
        roleCode: "DS",
        institutionId: null,
        validFrom: "2026-01-01T00:00:00Z",
        validTo: null,
      },
    ],
    dataScopes: [
      { assignmentId: "assignment-ds", type: "case", id: "case-100" },
    ],
  };
  const scopedAllowed = decision(
    service,
    scopedPrincipal,
    {
      resource: "AssignedCase",
      action: "read",
      dataScope: { type: "case", id: "case-100" },
      recordState: "Open",
      at,
    },
    scopedPolicy,
  );
  assert(
    scopedAllowed.allowed,
    "TC-FR-003-IAM003",
    "data scope and record state participate in the access decision when the policy requires them",
  );

  const wrongDataScope = decision(
    service,
    scopedPrincipal,
    {
      resource: "AssignedCase",
      action: "read",
      dataScope: { type: "case", id: "case-200" },
      recordState: "Open",
      at,
    },
    scopedPolicy,
  );
  assert(
    !wrongDataScope.allowed && wrongDataScope.reason === "DATA_SCOPE_MISMATCH",
    "TC-FR-003-IAM003",
    "a mismatched data scope is denied",
  );

  const wrongState = decision(
    service,
    scopedPrincipal,
    {
      resource: "AssignedCase",
      action: "read",
      dataScope: { type: "case", id: "case-100" },
      recordState: "Closed",
      at,
    },
    scopedPolicy,
  );
  assert(
    !wrongState.allowed && wrongState.reason === "RECORD_STATE_NOT_ALLOWED",
    "TC-FR-003-IAM003",
    "record state restrictions are enforced when declared by the policy",
  );

  const reportPolicy = {
    policyId: "IAM003-REPORT-SCOPE",
    resource: "Report",
    action: "read",
    allowedRoleCodes: ["UA"],
    institutionScope: "RESOURCE_INSTITUTION",
    dataScope: "NOT_APPLICABLE",
    recordState: { mode: "ANY" },
  };
  const foreignReport = decision(
    service,
    universityAdminA,
    {
      resource: "Report",
      action: "read",
      institutionId: "institution-b",
      at,
    },
    reportPolicy,
  );
  assert(
    !foreignReport.allowed &&
      foreignReport.reason === "INSTITUTION_SCOPE_MISMATCH",
    "TC-BR-035-IAM003",
    "report access uses the same institution-scope evaluator as operational data",
  );

  const privacyDecision = decision(
    service,
    scopedPrincipal,
    {
      resource: "AssignedCase",
      action: "read",
      dataScope: { type: "case", id: "case-secret-id" },
      recordState: "Closed",
      at,
    },
    scopedPolicy,
  );
  assert(
    !("dataScope" in privacyDecision) && !("principal" in privacyDecision),
    "TC-NFR-025-IAM003",
    "authorization decisions do not echo data-scope claims or principal payloads",
  );

  console.log("");
  console.log("IAM-003 scope-aware authorization check passed.");
  console.log(
    "NOTE IAM-003 provides the fail-closed authorization core and NestJS guard contract; IAM-005 supplies authenticated request principals and activates request-level enforcement.",
  );
  console.log(
    "NOTE UC-17 delegation expansion/limits remain owned by TASK-IAM-004; IAM-003 does not fabricate delegation privileges.",
  );
  console.log(
    "NOTE FR-037 durable/tamper-evident audit persistence is not falsely claimed; authorization denials emit correlation-aware structured security logs when the guard is used.",
  );
}

main();
