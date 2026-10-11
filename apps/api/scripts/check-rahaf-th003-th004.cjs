/**
 * TASK-TH-003 / TASK-TH-004 focused regression (UC-07/08).
 * Exercises compiled ThesisEntityService with ONLY TEST-LOCAL trusted adapter doubles.
 * No service is registered in Nest DI and no file/requirements scanner is bypassed
 * in the running application. This is NOT HTTP E2E, document-service proof,
 * persistent-transaction proof, or formal task acceptance.
 */
"use strict";

const assert = require("node:assert/strict");
const {
  ThesisEntityService,
} = require("../dist/thesis/domain/thesis-entity.service.js");
const {
  ThesisSupervisionContextService,
} = require("../dist/thesis/thesis-supervision-context.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  AcademicAuditService,
} = require("../dist/postgraduate/domain/academic-audit.service.js");

let total = 0;
function pass(id, title) {
  total += 1;
  console.log(`PASS ${id}: ${title}`);
}
async function denies(id, title, operation) {
  await assert.rejects(operation);
  pass(id, title);
}
function deniesSync(id, title, operation) {
  assert.throws(operation);
  pass(id, title);
}
function principal(role, institution = "INST-A", personId) {
  return {
    userId: `USER-${role}-${institution}`,
    authenticated: true,
    ...(personId ? { personId } : {}),
    roleAssignments: [
      {
        assignmentId: `ROLE-${role}-${institution}`,
        roleCode: role,
        institutionId: institution,
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
  };
}

function fixture() {
  const pga = principal("PGA");
  const pgo = principal("PGO");
  const foreignPga = principal("PGA", "INST-B");
  const student = principal("STUDENT", "INST-A", "PERSON-STUDENT");
  const assignedSupervisor = {
    userId: "USER-MAIN-SUPERVISOR",
    authenticated: true,
    roleAssignments: [],
  };
  const stranger = {
    userId: "USER-OTHER-SUPERVISOR",
    authenticated: true,
    roleAssignments: [],
  };
  const enrollment = {
    enrollmentId: "ENROLL-RAHAF-TEST",
    personId: "PERSON-STUDENT",
    institutionId: "INST-A",
    programId: "PROGRAM-A",
    status: "Active",
  };
  const controls = {
    proposalDocumentAvailable: true,
    finalDocumentAvailable: true,
    validFinalBinding: true,
    assignedMainId: "MAIN-1",
    requirementsMode: "satisfied",
  };
  const document = (thesisId, linkId, purpose) => ({
    available: true,
    targetType: "Thesis",
    targetId: thesisId,
    documentLinkId: linkId,
    documentId: `DOC-${linkId}`,
    purpose,
  });
  const documents = {
    async resolveAvailableLink(thesisId, linkId) {
      return document(thesisId, linkId, "ThesisProposalPlan");
    },
    async resolveAvailableProposalPlanLink(thesisId, linkId) {
      if (!controls.proposalDocumentAvailable) {
        throw new Error("Test-only Document Service unavailable");
      }
      return document(thesisId, linkId, "ThesisProposalPlan");
    },
    async resolveAvailableSubmissionLink(thesisId, linkId) {
      if (!controls.finalDocumentAvailable) {
        throw new Error("Test-only submission document unavailable");
      }
      return document(
        controls.validFinalBinding ? thesisId : "DIFFERENT-THESIS",
        linkId,
        "FinalThesisSubmission",
      );
    },
  };
  const supervisors = {
    async assertActiveMainSupervisor(thesisId, enrollmentId) {
      return {
        thesisId,
        enrollmentId,
        assignmentId: controls.assignedMainId,
      };
    },
    async assertAssignedMainSupervisor(thesisId, enrollmentId, actor) {
      if (actor.userId !== assignedSupervisor.userId) {
        throw new Error("Not the assigned Main Supervisor");
      }
      return {
        thesisId,
        enrollmentId,
        assignmentId: controls.assignedMainId,
      };
    },
  };
  const requirements = {
    async assertSatisfied(thesisId, enrollmentId, programId) {
      if (controls.requirementsMode === "unavailable") {
        throw new Error("Test-only program requirements unavailable");
      }
      return {
        thesisId:
          controls.requirementsMode === "wrong-thesis"
            ? "DIFFERENT-THESIS"
            : thesisId,
        enrollmentId,
        programId,
        requirementsSatisfied: true,
        policyVersionId: "POLICY-ACCEPTED-1",
        assessmentId: "ASSESSMENT-1",
      };
    },
  };
  const auth = {
    assertOfficer(actor, institutionId, programId) {
      if (
        !actor?.authenticated ||
        !["PGO", "PGA"].includes(actor.roleAssignments?.[0]?.roleCode) ||
        actor.roleAssignments[0].institutionId !== institutionId ||
        programId !== "PROGRAM-A"
      ) {
        throw new Error("Scoped officer authorization denied");
      }
    },
    assertAuthority(actor, institutionId, programId) {
      if (
        !actor?.authenticated ||
        actor.roleAssignments?.[0]?.roleCode !== "PGA" ||
        actor.roleAssignments[0].institutionId !== institutionId ||
        programId !== "PROGRAM-A"
      ) {
        throw new Error("Scoped authority authorization denied");
      }
    },
  };
  const chain = new ResearchAuditService();
  const audit = new AcademicAuditService(chain);
  const theses = new ThesisEntityService(
    {
      getOne(enrollmentId) {
        assert.equal(enrollmentId, enrollment.enrollmentId);
        return { ...enrollment };
      },
    },
    {
      getProgram() {
        return {
          institutionId: enrollment.institutionId,
          orgUnitId: "ORG-A",
        };
      },
    },
    {
      resolveCanonicalPersonId(personId) {
        return personId;
      },
    },
    auth,
    audit,
    documents,
    supervisors,
    requirements,
    new ThesisSupervisionContextService(),
  );
  function assignedThesis() {
    const draft = theses.createDraft(
      { enrollmentId: enrollment.enrollmentId, titleAr: "رسالة رهف التجريبية" },
      pga,
    );
    const id = draft.thesisId;
    theses.register(id, pga);
    theses.recordMainSupervisorAssigned(id, pga);
    return id;
  }
  return {
    pga,
    pgo,
    foreignPga,
    student,
    assignedSupervisor,
    stranger,
    controls,
    theses,
    chain,
    assignedThesis,
  };
}

async function main() {
  const f = fixture();
  const { pga, pgo, foreignPga, student, assignedSupervisor, stranger } = f;
  const id = f.assignedThesis();

  deniesSync(
    "TC-NFR-008/TC-FR-015-TH003",
    "Other institution cannot create a thesis",
    () =>
      f.theses.createDraft(
        { enrollmentId: "ENROLL-RAHAF-TEST", titleAr: "غير مصرح" },
        foreignPga,
      ),
  );
  await denies(
    "TC-UC-07-TH003",
    "Proposal cannot be submitted before it exists",
    () =>
      f.theses.submitProposal(id, { proposalVersionId: "MISSING" }, student),
  );
  const emptyPlan = await f.theses.addProposalVersion(
    id,
    { titleAr: "مقترح بدون ملف", abstract: "ملخص" },
    student,
  );
  await denies(
    "TC-FR-029-TH003",
    "Unlinked proposal plan is rejected on submission",
    () =>
      f.theses.submitProposal(
        id,
        { proposalVersionId: emptyPlan.thesisVersionId },
        student,
      ),
  );
  const plan = await f.theses.addProposalVersion(
    id,
    {
      titleAr: "مقترح معتمد للاختبار",
      abstract: "مضمون المقترح العلمي",
      documentLinkId: "PLAN-VERIFIED",
    },
    student,
  );
  assert.equal(plan.versionNo, emptyPlan.versionNo + 1);
  pass(
    "TC-BR-036/045-TH003",
    "Proposal revisions append new immutable version numbers",
  );
  f.controls.proposalDocumentAvailable = false;
  await denies(
    "TC-NFR-022/029-TH003",
    "Unavailable trusted plan check blocks proposal submission",
    () =>
      f.theses.submitProposal(
        id,
        { proposalVersionId: plan.thesisVersionId },
        student,
      ),
  );
  assert.equal(f.theses.getOne(id, pga).status, "SupervisorAssigned");
  pass(
    "TC-NFR-014-TH003",
    "Failed plan verification preserves pre-submit status",
  );
  f.controls.proposalDocumentAvailable = true;
  assert.equal(
    (
      await f.theses.submitProposal(
        id,
        { proposalVersionId: plan.thesisVersionId },
        student,
      )
    ).status,
    "ProposalSubmitted",
  );
  pass(
    "TC-FR-015/UC-07-TH003",
    "Trusted latest plan can enter ProposalSubmitted",
  );
  await denies(
    "TC-BR-011-TH003",
    "Unassigned reviewer cannot approve as Main Supervisor",
    () =>
      f.theses.reviewProposalAsSupervisor(
        id,
        { proposalVersionId: plan.thesisVersionId, approve: true },
        stranger,
      ),
  );
  assert.equal(
    (
      await f.theses.reviewProposalAsSupervisor(
        id,
        { proposalVersionId: plan.thesisVersionId, approve: true },
        assignedSupervisor,
      )
    ).status,
    "ProposalUnderReview",
  );
  pass(
    "TC-BR-011/013-TH003",
    "Verified assigned supervisor records scoped recommendation",
  );
  await denies(
    "TC-NFR-008-TH003",
    "PGO may not approve institutional proposal",
    () =>
      f.theses.approveProposal(
        id,
        { proposalVersionId: plan.thesisVersionId },
        pgo,
      ),
  );
  f.controls.assignedMainId = "MAIN-2";
  await denies(
    "TC-BR-011-TH003",
    "Supervisor change invalidates an old proposal sign-off",
    () =>
      f.theses.approveProposal(
        id,
        { proposalVersionId: plan.thesisVersionId },
        pga,
      ),
  );
  f.controls.assignedMainId = "MAIN-1";
  const approved = await f.theses.approveProposal(
    id,
    { proposalVersionId: plan.thesisVersionId, reason: "استوفى الشروط" },
    pga,
  );
  assert.equal(approved.thesis.status, "ProposalApproved");
  assert.equal(approved.approvedVersion.versionType, "Approved");
  assert.notEqual(
    approved.approvedVersion.thesisVersionId,
    plan.thesisVersionId,
  );
  assert.equal(
    f.theses.versions(id, pga).filter((x) => x.versionType === "Proposal")
      .length,
    2,
  );
  pass(
    "TC-BR-013/045-TH003",
    "PGA approval appends Approved version without rewriting proposal",
  );
  await denies(
    "TC-BR-014-TH003",
    "An approved proposal cannot be re-submitted",
    () =>
      f.theses.submitProposal(
        id,
        { proposalVersionId: plan.thesisVersionId },
        student,
      ),
  );
  assert.equal((await f.theses.beginThesisWork(id, pgo)).status, "InProgress");
  pass("TC-UC-07-TH003", "Approved proposal precedes InProgress transition");

  await denies(
    "TC-FR-029-TH004",
    "Final submission version requires document link",
    () => f.theses.addSubmissionVersion(id, {}, student),
  );
  f.controls.validFinalBinding = false;
  await denies(
    "TC-BR-057-TH004",
    "Document bound to another Thesis is not accepted",
    () =>
      f.theses.addSubmissionVersion(
        id,
        { documentLinkId: "FINAL-VERIFIED" },
        student,
      ),
  );
  f.controls.validFinalBinding = true;
  const submission = await f.theses.addSubmissionVersion(
    id,
    { documentLinkId: "FINAL-VERIFIED" },
    student,
  );
  assert.equal(submission.versionType, "Submission");
  pass(
    "TC-FR-016/BR-045-TH004",
    "Verified final document creates a distinct Submission version",
  );
  await denies(
    "TC-UC-08-TH004",
    "Submission without Main Supervisor confirmation is denied",
    () =>
      f.theses.submitThesis(
        id,
        { submissionVersionId: submission.thesisVersionId },
        student,
      ),
  );
  await denies(
    "TC-BR-011-TH004",
    "Wrong supervisor cannot confirm final version",
    () =>
      f.theses.confirmSubmissionReadiness(
        id,
        { submissionVersionId: submission.thesisVersionId },
        stranger,
      ),
  );
  const confirmation = await f.theses.confirmSubmissionReadiness(
    id,
    { submissionVersionId: submission.thesisVersionId },
    assignedSupervisor,
  );
  assert.equal(confirmation.submissionVersionId, submission.thesisVersionId);
  pass(
    "TC-BR-011-TH004",
    "Authorized Main Supervisor confirms the exact final version",
  );
  await denies(
    "TC-UC-08-TH004",
    "Same final version cannot be confirmed twice",
    () =>
      f.theses.confirmSubmissionReadiness(
        id,
        { submissionVersionId: submission.thesisVersionId },
        assignedSupervisor,
      ),
  );
  f.controls.assignedMainId = "MAIN-2";
  await denies(
    "TC-BR-011-TH004",
    "Changed supervisor invalidates final submission confirmation",
    () =>
      f.theses.submitThesis(
        id,
        { submissionVersionId: submission.thesisVersionId },
        student,
      ),
  );
  f.controls.assignedMainId = "MAIN-1";
  f.controls.requirementsMode = "unavailable";
  await denies(
    "TC-UC-08-TH004",
    "Unavailable trusted programme requirements block submission",
    () =>
      f.theses.submitThesis(
        id,
        { submissionVersionId: submission.thesisVersionId },
        student,
      ),
  );
  f.controls.requirementsMode = "wrong-thesis";
  await denies(
    "TC-BR-045-TH004",
    "Requirements evidence scoped to another Thesis is rejected",
    () =>
      f.theses.submitThesis(
        id,
        { submissionVersionId: submission.thesisVersionId },
        student,
      ),
  );
  assert.equal(f.theses.getOne(id, pga).status, "InProgress");
  pass(
    "TC-NFR-014-TH004",
    "Failure of trusted requirements does not partially mark Submitted",
  );
  f.controls.requirementsMode = "satisfied";
  const result = await f.theses.submitThesis(
    id,
    { submissionVersionId: submission.thesisVersionId },
    student,
  );
  assert.equal(result.thesis.status, "Submitted");
  assert.ok(result.submissionVersion.submittedAt);
  assert.equal(f.theses.getOne(id, pga).status, "Submitted");
  pass(
    "TC-FR-016/UC-08-TH004",
    "Approved evidence permits Submitted once, with immutable timestamp",
  );
  await denies(
    "TC-UC-08-TH004",
    "Already Submitted thesis rejects duplicate submission",
    () =>
      f.theses.submitThesis(
        id,
        { submissionVersionId: submission.thesisVersionId },
        student,
      ),
  );
  const immutableVersion = f.theses
    .versions(id, pga)
    .find((x) => x.thesisVersionId === plan.thesisVersionId);
  assert.equal(immutableVersion.versionType, "Proposal");
  assert.ok(immutableVersion.submittedAt);
  assert.equal(f.chain.verifyChain(), true);
  pass(
    "TC-FR-045/NFR-011-TH004",
    "Proposal history and prototype audit chain survive final submission",
  );
  f.controls.finalDocumentAvailable = false;
  await denies(
    "TC-FR-029/BR-015-TH004",
    "Submission cannot be attested to Defense after document becomes unavailable",
    () => f.theses.assertSubmittedForDefense(id, pga),
  );

  console.log(
    `\nRAHAF TH003/TH004 FOCUSED CHECKS PASSED (${total} checks; test doubles only)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
