const {
  USER_STATUSES,
  canTransitionUserStatus,
} = require("../dist/identity/domain/user-status.js");
const { UserAccount } = require("../dist/identity/domain/user-account.js");
const { Person } = require("../dist/identity/domain/person.js");
const {
  changeAccountStatus,
} = require("../dist/identity/domain/account-lifecycle.js");

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
  assert(
    JSON.stringify(USER_STATUSES) ===
      JSON.stringify(["Invited", "Active", "Locked", "Disabled", "Archived"]),
    "TC-FR-001",
    "canonical UserStatus catalogue is preserved",
  );

  const person = new Person({
    personId: "person-001",
    fullNameAr: "مستخدم تجريبي",
    status: "Active",
  });

  assert(
    person.personId === "person-001",
    "TC-BR-055",
    "Person remains the identity root",
  );

  expectThrow(
    () =>
      new Person({
        personId: "person-002",
        status: "Active",
      }),
    "TC-BR-055",
    "Person requires at least one canonical name",
  );

  const account = new UserAccount({
    userId: "user-001",
    personId: person.personId,
    username: "prototype.user",
    status: "Invited",
    mfaRequired: false,
  });

  assert(
    account.personId === person.personId,
    "TC-FR-001",
    "UserAccount is linked to Person by personId",
  );

  const activated = changeAccountStatus(account, "Active");

  assert(
    activated.fromStatus === "Invited" && account.status === "Active",
    "TC-FR-001",
    "Invited account can be activated through a lifecycle operation",
  );

  assert(
    account.canStartSession(),
    "TC-BR-040",
    "Active account is eligible for later session creation",
  );

  const disabled = changeAccountStatus(account, "Disabled");

  assert(
    disabled.toStatus === "Disabled" && !account.canStartSession(),
    "TC-BR-040",
    "Disabled account is not eligible for a new session",
  );

  expectThrow(
    () => account.transitionTo("Active"),
    "TC-FR-001",
    "unsupported Disabled -> Active direct transition is denied",
  );

  assert(
    canTransitionUserStatus("Disabled", "Archived"),
    "TC-FR-001",
    "Disabled account can be archived",
  );

  console.log("");
  console.log("IAM-001 user/account model check passed.");
}

main();
