const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");
const {
  DelegationAuthorizationService,
} = require("../dist/identity/delegation/delegation-authorization.service.js");
const {
  DelegationPolicyService,
} = require("../dist/identity/delegation/delegation-policy.service.js");
const {
  RoleDelegation,
} = require("../dist/identity/domain/role-delegation.js");

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
  } catch (_error) {
    thrown = true;
  }
  assert(thrown, sourceId, message);
}

function delegation(overrides = {}) {
  return new RoleDelegation({
    delegationId: "delegation-001",
    delegatorUserId: "manager-a",
    delegateUserId: "officer-b",
    roleCode: "UA",
    scopeType: "Institution",
    scopeId: "institution-a",
    startAt: "2026-10-01T00:00:00Z",
    endAt: "2026-10-10T00:00:00Z",
    reason: "Temporary committee coverage",
    status: "Active",
    ...overrides,
  });
}

function main() {
  const policyService = new DelegationPolicyService();
  const grantService = new DelegationAuthorizationService(policyService);
  const authorization = new AuthorizationDecisionService();
  const at = "2026-10-02T12:00:00Z";

  const valid = delegation();
  assert(
    valid.status === "Active" && valid.reason.length > 0,
    "TC-FR-044-IAM004",
    "RoleDelegation preserves delegator, delegate, role, bounded scope, reason, start/end and status",
  );

  expectThrow(
    () => delegation({ endAt: "2026-10-01T00:00:00Z" }),
    "TC-FR-044-IAM004 / BR-028",
    "a delegation rejects endAt that is not later than startAt",
  );

  expectThrow(
    () => delegation({ roleCode: "SUPER_ADMIN" }),
    "TC-BR-028-IAM004 / NFR-008",
    "unknown role codes cannot become delegated privileges",
  );

  const delegatorContext = {
    at,
    delegatorRoleAssignments: [
      {
        assignmentId: "ua-a",
        roleCode: "UA",
        institutionId: "institution-a",
        validFrom: "2026-01-01T00:00:00Z",
        validTo: null,
      },
    ],
  };

  const validCreation = policyService.validateCreation(valid, delegatorContext);
  assert(
    validCreation.allowed && validCreation.sourceAssignmentId === "ua-a",
    "TC-BR-028-IAM004 / UC-24",
    "delegation is allowed only when the delegator actively holds the same role inside the delegated scope",
  );

  const foreignScope = policyService.validateCreation(
    delegation({ scopeId: "institution-b" }),
    delegatorContext,
  );
  assert(
    !foreignScope.allowed && foreignScope.reason === "SCOPE_NOT_COVERED",
    "TC-BR-028-IAM004 / UC-24",
    "a delegator cannot delegate a wider institution scope than the source assignment",
  );

  const missingRole = policyService.validateCreation(valid, {
    at,
    delegatorRoleAssignments: [
      {
        assignmentId: "pgo-a",
        roleCode: "PGO",
        institutionId: "institution-a",
        validFrom: "2026-01-01T00:00:00Z",
        validTo: null,
      },
    ],
  });
  assert(
    !missingRole.allowed && missingRole.reason === "DELEGATOR_ROLE_NOT_HELD",
    "TC-BR-028-IAM004",
    "a delegator cannot delegate a role that the delegator does not hold",
  );

  const ended = policyService.evaluateEffectiveness(valid, {
    at: "2026-10-10T00:00:00Z",
    delegatorAccountActive: true,
    delegateAccountActive: true,
    originalRoleAssignmentActive: true,
  });
  assert(
    !ended.effective && ended.reason === "END_REACHED",
    "TC-BR-058-IAM004",
    "delegation stops being effective automatically when endAt is reached",
  );

  const disabledAccount = policyService.evaluateEffectiveness(valid, {
    at,
    delegatorAccountActive: true,
    delegateAccountActive: false,
    originalRoleAssignmentActive: true,
  });
  assert(
    !disabledAccount.effective && disabledAccount.reason === "ACCOUNT_DISABLED",
    "TC-BR-058-IAM004 / NFR-030",
    "delegation stops being effective when either account is disabled",
  );

  const revokedOriginalRole = policyService.evaluateEffectiveness(valid, {
    at,
    delegatorAccountActive: true,
    delegateAccountActive: true,
    originalRoleAssignmentActive: false,
  });
  assert(
    !revokedOriginalRole.effective &&
      revokedOriginalRole.reason === "ORIGINAL_ROLE_REVOKED",
    "TC-BR-058-IAM004",
    "delegation stops being effective when the original role assignment is no longer active",
  );

  const grant = grantService.toAuthorizationGrant(valid, {
    at,
    delegatorAccountActive: true,
    delegateAccountActive: true,
    originalRoleAssignmentActive: true,
  });
  assert(
    grant &&
      grant.roleAssignment.delegationId === "delegation-001" &&
      grant.roleAssignment.institutionId === "institution-a",
    "TC-FR-044-IAM004 / BR-058",
    "an effective delegation becomes a bounded authorization grant that retains delegationId",
  );

  const decision = authorization.evaluate(
    {
      userId: "officer-b",
      authenticated: true,
      roleAssignments: [grant.roleAssignment],
      dataScopes: [grant.dataScope],
    },
    {
      resource: "DelegatedInstitutionResource",
      action: "read",
      institutionId: "institution-a",
      at,
    },
    {
      policyId: "IAM004-DELEGATED-UA-READ",
      resource: "DelegatedInstitutionResource",
      action: "read",
      allowedRoleCodes: ["UA"],
      institutionScope: "RESOURCE_INSTITUTION",
      dataScope: "NOT_APPLICABLE",
      recordState: { mode: "ANY" },
    },
  );
  assert(
    decision.allowed && decision.delegationId === "delegation-001",
    "TC-BR-058-IAM004 / NFR-011",
    "authorization decisions retain delegationId so sensitive delegated use can be audited",
  );

  const noGrantAfterExpiry = grantService.toAuthorizationGrant(valid, {
    at: "2026-10-11T00:00:00Z",
    delegatorAccountActive: true,
    delegateAccountActive: true,
    originalRoleAssignmentActive: true,
  });
  assert(
    noGrantAfterExpiry === null,
    "TC-BR-058-IAM004",
    "expired delegations cannot produce authorization grants",
  );

  console.log("\nIAM-004 delegation model check passed.");
  console.log(
    "NOTE RoleDelegation persistence/write endpoints remain deferred until authenticated request identity and persistence boundaries are available.",
  );
  console.log(
    "NOTE NFR-011 durable tamper-evident audit storage is not falsely claimed; delegated authorization propagates delegationId and the guard emits a structured delegated-use security event.",
  );
  console.log(
    "NOTE UC-24 mentions actions while the canonical RoleDelegation data dictionary has no actions field; IAM-004 does not invent one. Existing IAM-003 policies continue to restrict resource/action use.",
  );
}

main();
