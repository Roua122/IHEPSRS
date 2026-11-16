/* HRD001: verifiable in-process security checks; not a production security attestation. */
const assert = require("node:assert/strict");
const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");
const {
  InstitutionAuthorizationService,
} = require("../dist/institutions/institution-authorization.service.js");
const {
  AcademicAuthorizationService,
} = require("../dist/postgraduate/domain/academic-authorization.service.js");
const {
  PrototypeAuditService,
} = require("../dist/common/audit/prototype-audit.service.js");
const {
  LocalCredentialPolicyService,
} = require("../dist/identity/authentication/local-credential-policy.service.js");
const {
  LoginAttemptTrackerService,
} = require("../dist/identity/authentication/login-attempt-tracker.service.js");
const {
  SessionService,
} = require("../dist/identity/authentication/session.service.js");
const {
  UnavailableDefenseEligibilityGateway,
} = require("../dist/thesis/domain/defense-eligibility.gateway.js");
let n = 0;
function pass(id, comment) {
  n++;
  console.log(`PASS ${id}: ${comment}`);
}
function deny(fn, id, message) {
  assert.throws(fn);
  pass(id, message);
}
const p = (
  userId,
  roleCode,
  institutionId,
  validFrom = "2026-01-01T00:00:00.000Z",
) => ({
  userId,
  authenticated: true,
  roleAssignments: [
    {
      assignmentId: `A-${userId}`,
      roleCode,
      institutionId,
      validFrom,
      validTo: null,
    },
  ],
});
async function main() {
  const decisions = new AuthorizationDecisionService();
  const policy = {
    policyId: "HRD001-SCOPE",
    resource: "Postgraduate",
    action: "Manage",
    allowedRoleCodes: ["PGO", "PGA"],
    institutionScope: "RESOURCE_INSTITUTION",
    dataScope: "NOT_APPLICABLE",
    recordState: { mode: "ANY" },
  };
  assert.equal(
    decisions.evaluate(
      undefined,
      { resource: "Postgraduate", action: "Manage", institutionId: "INST-A" },
      policy,
    ).allowed,
    false,
  );
  pass("TC-FR-003/TC-NFR-008", "Unauthenticated operation denied by default");
  assert.equal(
    decisions.evaluate(
      p("STAFF", "PGO", "INST-A"),
      { resource: "Postgraduate", action: "Manage", institutionId: "INST-B" },
      policy,
    ).allowed,
    false,
  );
  pass("TC-BR-027", "Role bound to institution A cannot operate in B");
  assert.equal(
    decisions.evaluate(
      p("STAFF", "PGO", "INST-A", "2030-01-01T00:00:00.000Z"),
      { resource: "Postgraduate", action: "Manage", institutionId: "INST-A" },
      policy,
    ).allowed,
    false,
  );
  pass("TC-FR-003", "Inactive future role assignment is denied");
  const registry = new InstitutionAuthorizationService(decisions);
  deny(
    () =>
      registry.assertInstitutionMasterData(p("USER", "UA", "INST-A"), "INST-B"),
    "TC-BR-027",
    "Institution master-data scope denied",
  );
  const academic = new AcademicAuthorizationService(decisions);
  deny(
    () =>
      academic.assertAuthority(
        p("OFFICER", "PGO", "INST-A"),
        "INST-A",
        "PROGRAM-1",
      ),
    "TC-FR-003",
    "PGO cannot use PGA-only decisions",
  );
  academic.assertAuthority(p("AUTH", "PGA", "INST-A"), "INST-A", "PROGRAM-1");
  pass("TC-FR-003", "Correctly-scoped PGA is authorized");
  deny(
    () =>
      academic.assertOfficer(
        p("OTHER", "PGO", "INST-B"),
        "INST-A",
        "PROGRAM-1",
      ),
    "TC-BR-027",
    "Cross-institution PG access denied",
  );
  const audit = new PrototypeAuditService();
  audit.append({
    actorUserId: "AUTH",
    action: "Enrollment.approved",
    entityType: "Enrollment",
    entityId: "EN-1",
    metadata: { sourceId: "FR-037" },
  });
  audit.append({
    actorUserId: "AUTH",
    action: "Thesis.archived",
    entityType: "Thesis",
    entityId: "TH-1",
  });
  assert.equal(audit.verifyChain(), true);
  pass(
    "TC-FR-037/TC-NFR-011",
    "Sensitive actions are included in valid chained audit history",
  );
  const copied = audit.list();
  copied[0].action = "Forged";
  assert.equal(audit.verifyChain(), true);
  pass(
    "TC-NFR-011",
    "Caller cannot mutate prototype audit through its read API",
  );
  audit.entries[0].action = "Forged";
  assert.equal(audit.verifyChain(), false);
  pass(
    "TC-NFR-011",
    "Tampering with internal audit hash-chain is detected (not WORM)",
  );
  const creds = new LocalCredentialPolicyService();
  assert.equal(creds.evaluate("password1234").accepted, false);
  pass("TC-NFR-031", "Common local password rejected");
  const attempts = new LoginAttemptTrackerService();
  const now = Date.parse("2026-10-11T12:00:00Z");
  for (let i = 0; i < 5; i++) attempts.recordFailure("victim", now + i * 1000);
  assert.equal(attempts.isLocked("victim", now + 5000), true);
  pass("TC-NFR-031", "Five bad credentials lock local account temporarily");
  const sessions = new SessionService();
  // Full session login/revocation/MFA paths are exercised by iam005:check in CI.
  assert.equal(typeof sessions.authenticate, "function");
  pass(
    "TC-NFR-030",
    "Session model available; IAM005 performs expiration/revocation verification",
  );
  const gateway = new UnavailableDefenseEligibilityGateway();
  await assert.rejects(() =>
    gateway.assertEligible({ thesisId: "X", members: [] }),
  );
  pass(
    "TC-NFR-008/TC-FR-018",
    "Unconfigured trusted academic eligibility integration is fail-closed",
  );
  console.log(
    `HRD001 FOCUSED SECURITY VERIFICATION PASSED (${n} checks; production controls NOT attested)`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
