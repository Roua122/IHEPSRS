/**
 * TASK-PG-001 focused domain regression (FR-041/042; BR-004/005/055; NFR-025).
 * Run AFTER building API: node apps/api/scripts/check-pg001.cjs (from repo root).
 * Uses real compiled application classes and local in-memory prototype state.
 * This is NOT a substitute for HTTP E2E, persistent storage or GitHub CI.
 */
"use strict";

const assert = require("node:assert/strict");
const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");
const {
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  AcademicAuditService,
} = require("../dist/postgraduate/domain/academic-audit.service.js");
const {
  AcademicAuthorizationService,
} = require("../dist/postgraduate/domain/academic-authorization.service.js");
const {
  ApplicantService,
} = require("../dist/postgraduate/domain/applicant.service.js");

let checks = 0;
function test(sourceId, description, fn) {
  try {
    fn();
    checks += 1;
    console.log(`PASS ${sourceId}: ${description}`);
  } catch (error) {
    console.error(`FAIL ${sourceId}: ${description}`);
    throw error;
  }
}
function principal(personId, roleCode = "PGO", institutionId = "INST-001") {
  return {
    userId: `PG001-U-${personId}`,
    personId,
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: `PG001-A-${personId}`,
        roleCode,
        institutionId,
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
  };
}

const persons = new PersonIdentityService();
const decisions = new AuthorizationDecisionService();
const authorization = new AcademicAuthorizationService(decisions);
const auditEntries = new ResearchAuditService();
const audit = new AcademicAuditService(auditEntries);
const applicants = new ApplicantService(persons, authorization, audit);
const applicant = principal("PG001-P-NEW");
const studentSource = {
  personId: applicant.personId,
  institutionId: "INST-001",
  sourceSystem: "MOCK_UNIVERSITY_SIS",
  externalStudentId: "PG001-EXT-STUDENT",
  academicStatus: "Active",
  lastSourceUpdateAt: "2026-10-01T00:00:00.000Z",
};

test("TC-FR-041", "A Person can be registered before any SIS Student", () => {
  const person = applicants.registerSelf(
    {
      fullNameAr: "متقدم تجريبي",
      email: "pg001@example.test",
      birthDate: "2000-01-02",
    },
    applicant,
  );
  assert.equal(person.personId, applicant.personId);
  assert.equal(
    applicants.getStudentForPerson(person.personId, "INST-001"),
    undefined,
  );
});

test("TC-FR-041", "Self lookup refers to the newly registered Person", () => {
  assert.equal(applicants.getOwnPerson(applicant).personId, applicant.personId);
});

test(
  "TC-NFR-025",
  "Unauthenticated applicant registration is forbidden",
  () => {
    assert.throws(() =>
      applicants.registerSelf(
        { fullNameEn: "Untrusted" },
        {
          ...applicant,
          authenticated: false,
        },
      ),
    );
  },
);

test(
  "TC-NFR-025",
  "Applicant operations require a verified Person scope",
  () => {
    assert.throws(() =>
      authorization.assertApplicant(applicant, "SOMEONE-ELSE"),
    );
    assert.throws(() =>
      applicants.getOwnPerson({ ...applicant, personId: "" }),
    );
  },
);

test(
  "TC-FR-041",
  "Name and valid email are required when creating a new Person",
  () => {
    assert.throws(() =>
      applicants.registerSelf({}, principal("PG001-P-EMPTY")),
    );
    assert.throws(() =>
      applicants.registerSelf(
        { fullNameEn: "Invalid", email: "not-an-email" },
        principal("PG001-P-INVALID"),
      ),
    );
  },
);
test("TC-FR-041", "Birth date calendar validation", () => {
  const p = new PersonIdentityService();
  assert.throws(
    () =>
      p.registerApplicantPerson({
        personId: "PG001-DATE-BAD",
        fullNameEn: "Test",
        birthDate: "2026-02-30",
      }),
    /FR-041/,
  );
  assert.doesNotThrow(() =>
    p.registerApplicantPerson({
      personId: "PG001-DATE-OK",
      fullNameEn: "Test",
      birthDate: "2024-02-29",
    }),
  );
});
test(
  "TC-BR-055",
  "Applicant and Research share the same canonical Person root",
  () => {
    assert.equal(
      persons.resolveCanonicalPersonId(applicant.personId),
      applicant.personId,
    );
  },
);

test(
  "TC-BR-055",
  "Email alone is never sufficient evidence for duplicate identification",
  () => {
    assert.equal(
      persons.findMatchingPersons({ email: "pg001@example.test" }).length,
      0,
    );
    assert.equal(
      persons.findMatchingPersons({
        email: "pg001@example.test",
        birthDate: "2000-01-02",
      }).length,
      1,
    );
  },
);

test(
  "TC-BR-005",
  "Applicant registration does not overwrite an existing SIS/Research Person",
  () => {
    const original = persons.getPerson("P-101");
    const returned = applicants.registerSelf(
      { fullNameEn: "Trying to overwrite" },
      principal("P-101"),
    );
    assert.equal(returned.fullNameEn, original.fullNameEn);
    assert.equal(persons.getPerson("P-101").fullNameEn, original.fullNameEn);
  },
);

test(
  "TC-NFR-025",
  "Existing protected identifier is masked in applicant-facing output",
  () => {
    const result = applicants.getOwnPerson(principal("P-101"));
    assert.notEqual(result.nationalIdentifier, "HMAC_NAT_1010101");
    assert.match(result.nationalIdentifier, /\*{3}/);
  },
);

test(
  "TC-FR-041",
  "Trusted SIS upsert links a Student to the existing Person",
  () => {
    const linked = applicants.acceptTrustedStudentUpsert(studentSource);
    assert.equal(linked.personId, applicant.personId);
    assert.equal(
      applicants.getStudentForPerson(applicant.personId, "INST-001").studentId,
      linked.studentId,
    );
  },
);

test(
  "TC-BR-004",
  "Central Student ID is separate from external SIS Student ID",
  () => {
    const student = applicants.getStudentForPerson(
      applicant.personId,
      "INST-001",
    );
    assert.notEqual(student.studentId, student.externalStudentId);
    assert.equal(student.externalStudentId, studentSource.externalStudentId);
    assert.equal(student.sourceSystem, studentSource.sourceSystem);
  },
);

test(
  "TC-BR-005",
  "Stale SIS messages never overwrite newer academic data",
  () => {
    const stale = applicants.acceptTrustedStudentUpsert({
      ...studentSource,
      academicStatus: "Tampered",
      lastSourceUpdateAt: "2026-09-01T00:00:00.000Z",
    });
    assert.equal(stale.academicStatus, "Active");
  },
);

test(
  "TC-BR-055",
  "Conflicting SIS identity maps do not silently reassign a Person",
  () => {
    const other = principal("PG001-P-OTHER");
    applicants.registerSelf({ fullNameEn: "Other" }, other);
    assert.throws(() =>
      applicants.acceptTrustedStudentUpsert({
        ...studentSource,
        personId: other.personId,
        lastSourceUpdateAt: "2026-10-02T00:00:00.000Z",
      }),
    );
  },
);

test(
  "TC-FR-042",
  "Data Steward identity merge leaves a canonical target and auditable record",
  () => {
    const merged = persons.mergePersonIdentities(
      {
        sourcePersonId: "P-102",
        targetPersonId: "P-101",
        reason: "PG001 verified duplicate evidence",
      },
      "PG001-DS-USER",
    );
    assert.equal(persons.resolveCanonicalPersonId("P-102"), "P-101");
    assert.ok(
      persons
        .getMergeAuditLogs()
        .some((entry) => entry.auditId === merged.auditId),
    );
  },
);

test(
  "TC-FR-042",
  "Audited identity unmerge restores the original canonical reference",
  () => {
    const record = persons.getMergeAuditLogs().at(-1);
    persons.unmergePersonIdentities(
      { auditId: record.auditId, reason: "PG001 verified reversal" },
      "PG001-DS-USER",
    );
    assert.equal(persons.resolveCanonicalPersonId("P-102"), "P-102");
    assert.ok(persons.getMergeAuditLogs().at(-1).reversedAt);
  },
);

test(
  "TC-NFR-014",
  "Applicant registration and SIS association produce valid audit chain",
  () => {
    assert.ok(
      auditEntries
        .list()
        .some((entry) => entry.action === "applicant.person.created"),
    );
    assert.ok(
      auditEntries
        .list()
        .some((entry) => entry.action === "student.sis.upsert"),
    );
    assert.equal(auditEntries.verifyChain(), true);
  },
);

console.log(`\nSUCCESS: ${checks} TASK-PG-001 focused checks`);
