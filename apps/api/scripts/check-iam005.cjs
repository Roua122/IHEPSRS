const {
  LocalCredentialPolicyService,
} = require("../dist/identity/authentication/local-credential-policy.service.js");
const {
  LoginAttemptTrackerService,
} = require("../dist/identity/authentication/login-attempt-tracker.service.js");
const {
  TotpService,
} = require("../dist/identity/authentication/totp.service.js");
const {
  SessionService,
} = require("../dist/identity/authentication/session.service.js");
const {
  PrototypeLocalIdentityService,
} = require("../dist/identity/authentication/prototype-local-identity.service.js");
const {
  AuthenticationService,
} = require("../dist/identity/authentication/authentication.service.js");

function assert(condition, sourceId, message) {
  if (!condition) throw new Error(`${sourceId}: ${message}`);
  console.log(`PASS ${sourceId}: ${message}`);
}

function makeAuth({ status = "Active", profile = "SENSITIVE" } = {}) {
  const totp = new TotpService();
  const identity = new PrototypeLocalIdentityService(undefined, {
    enabled: true,
    trustedSsoAvailable: false,
    username: "demo.admin",
    password: "ValidDemoPass!2026",
    totpSecret: "JBSWY3DPEHPK3PXP",
    userId: "user-iam005",
    personId: "person-iam005",
    roleCode: "CGA",
    institutionId: null,
    sessionProfile: profile,
    status,
  });
  const passwordPolicy = new LocalCredentialPolicyService();
  const attempts = new LoginAttemptTrackerService();
  const sessions = new SessionService();
  const service = new AuthenticationService(
    identity,
    passwordPolicy,
    attempts,
    totp,
    sessions,
  );
  return { service, totp, attempts, sessions };
}

function main() {
  const passwordPolicy = new LocalCredentialPolicyService();
  assert(
    !passwordPolicy.evaluate("short-pass").accepted,
    "TC-NFR-031-IAM005",
    "local credential policy rejects passwords shorter than 12 characters",
  );
  assert(
    !passwordPolicy.evaluate("password1234").accepted,
    "TC-NFR-031-IAM005",
    "prototype local credential screening rejects a common/breached sample password",
  );

  const attempts = new LoginAttemptTrackerService();
  const base = Date.parse("2026-10-02T12:00:00Z");
  for (let i = 0; i < 5; i += 1)
    attempts.recordFailure("demo", base + i * 1000);
  assert(
    attempts.isLocked("demo", base + 5000),
    "TC-NFR-031-IAM005",
    "five failed attempts within 15 minutes trigger a temporary lock",
  );
  assert(
    !attempts.isLocked("demo", base + 16 * 60 * 1000),
    "TC-NFR-031-IAM005",
    "temporary lock expires after the 15 minute lock duration",
  );

  const auth = makeAuth();
  const mfaCode = auth.totp.codeForTesting("JBSWY3DPEHPK3PXP", base);
  const login = auth.service.login(
    {
      username: "demo.admin",
      password: "ValidDemoPass!2026",
      mfaCode,
    },
    base,
  );
  assert(
    login.tokenType === "Bearer" &&
      login.session.principal.userId === "user-iam005",
    "TC-FR-002-IAM005 / UC-01",
    "valid local fallback credentials plus MFA create an authenticated session",
  );
  assert(
    login.session.idleTimeoutMinutes === 15 &&
      login.session.maxSessionHours === 8,
    "TC-NFR-030-IAM005",
    "sensitive session uses 15 minute idle and 8 hour maximum limits",
  );

  const regular = makeAuth({ profile: "REGULAR" });
  const regularCode = regular.totp.codeForTesting("JBSWY3DPEHPK3PXP", base);
  const regularLogin = regular.service.login(
    {
      username: "demo.admin",
      password: "ValidDemoPass!2026",
      mfaCode: regularCode,
    },
    base,
  );
  assert(
    regularLogin.session.idleTimeoutMinutes === 30 &&
      regularLogin.session.maxSessionHours === 12,
    "TC-NFR-030-IAM005",
    "regular session uses 30 minute idle and 12 hour maximum limits",
  );

  assert(
    auth.sessions.authenticate(login.accessToken, base + 14 * 60 * 1000) !==
      null,
    "TC-NFR-030-IAM005",
    "active sensitive session remains valid before idle timeout",
  );
  assert(
    auth.sessions.authenticate(login.accessToken, base + 30 * 60 * 1000) ===
      null,
    "TC-NFR-030-IAM005",
    "idle sensitive session expires and cannot authenticate",
  );

  const logoutAuth = makeAuth();
  const logoutCode = logoutAuth.totp.codeForTesting("JBSWY3DPEHPK3PXP", base);
  const logoutLogin = logoutAuth.service.login(
    {
      username: "demo.admin",
      password: "ValidDemoPass!2026",
      mfaCode: logoutCode,
    },
    base,
  );
  logoutAuth.service.logout(logoutLogin.session.sessionId);
  assert(
    logoutAuth.sessions.authenticate(logoutLogin.accessToken, base + 1000) ===
      null,
    "TC-FR-002-IAM005 / TC-NFR-030-IAM005",
    "logout revokes the session token",
  );

  const disabled = makeAuth({ status: "Disabled" });
  const disabledCode = disabled.totp.codeForTesting("JBSWY3DPEHPK3PXP", base);
  let disabledDenied = false;
  try {
    disabled.service.login(
      {
        username: "demo.admin",
        password: "ValidDemoPass!2026",
        mfaCode: disabledCode,
      },
      base,
    );
  } catch {
    disabledDenied = true;
  }
  assert(
    disabledDenied,
    "TC-BR-040-IAM005 / UC-19",
    "disabled accounts cannot create new sessions",
  );

  const reauth = makeAuth();
  const reauthCode = reauth.totp.codeForTesting("JBSWY3DPEHPK3PXP", base);
  const reauthLogin = reauth.service.login(
    {
      username: "demo.admin",
      password: "ValidDemoPass!2026",
      mfaCode: reauthCode,
    },
    base,
  );
  reauth.service.reauthenticate(
    reauthLogin.session.sessionId,
    "user-iam005",
    { password: "ValidDemoPass!2026", mfaCode: reauthCode },
    base,
  );
  assert(
    reauth.sessions.consumeSensitiveReauthentication(
      reauthLogin.session.sessionId,
    ),
    "TC-NFR-030-IAM005",
    "successful credential plus MFA re-authentication arms one sensitive action",
  );
  assert(
    !reauth.sessions.consumeSensitiveReauthentication(
      reauthLogin.session.sessionId,
    ),
    "TC-NFR-030-IAM005",
    "sensitive re-authentication marker is consumed instead of silently persisting for the whole session",
  );

  const ssoAvailableIdentity = new PrototypeLocalIdentityService(undefined, {
    enabled: true,
    trustedSsoAvailable: true,
    username: "demo.admin",
    password: "ValidDemoPass!2026",
    totpSecret: "JBSWY3DPEHPK3PXP",
    userId: "user-sso",
    personId: "person-sso",
    roleCode: "CGA",
    institutionId: null,
    sessionProfile: "SENSITIVE",
  });
  assert(
    !ssoAvailableIdentity.isLocalFallbackAvailable(),
    "TC-NFR-031-IAM005",
    "local fallback is unavailable while trusted SSO is declared available",
  );

  console.log("");
  console.log("IAM-005 authentication/session security check passed.");
  console.log(
    "NOTE The academic prototype uses an in-memory opaque bearer session store; production persistence/HA and enterprise IdP integration remain deployment work, not new business semantics.",
  );
  console.log(
    "NOTE Local fallback password screening includes a prototype common/breached denylist mechanism; production must use a maintained breach/common corpus or provider before release.",
  );
  console.log(
    "NOTE No real password or TOTP secret is committed. Runtime demo credentials must be supplied only through the local .env when trusted SSO is unavailable.",
  );
}

main();
