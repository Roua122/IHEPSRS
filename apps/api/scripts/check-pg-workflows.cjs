/**
 * PG002–PG005 focused domain regression — compiled services, canonical INS.
 * This is NOT HTTP E2E, real Document/SIS integration, durable DB validation,
 * complete security acceptance, nor a substitute for the shared service gates.
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
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  BusinessPolicyService,
} = require("../dist/config/business-policy.service.js");
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
  EnrollmentPolicyService,
} = require("../dist/postgraduate/domain/enrollment-policy.service.js");
const {
  EnrollmentLifecycleService,
} = require("../dist/postgraduate/domain/enrollment-lifecycle.service.js");
const {
  UnavailableDegreeReadinessGateway,
} = require("../dist/postgraduate/domain/degree-readiness.gateway.js");
const {
  UnavailableApplicationDocumentGateway,
} = require("../dist/postgraduate/domain/application-document.gateway.js");

const PROGRAM = "PROGRAM-DEMO-001";
const CYCLE = "CYCLE-DEMO-2026";
const INST = "INST-001";
const YEAR = "2026/2027";
let checks = 0;
async function check(ids, description, fn) {
  try {
    await fn();
    checks++;
    console.log(`PASS ${ids}: ${description}`);
  } catch (error) {
    console.error(`FAIL ${ids}: ${description}`);
    throw error;
  }
}
function user(userId, roleCode, institutionId = INST) {
  return {
    userId,
    personId: userId,
    authenticated: true,
    roleAssignments: roleCode
      ? [
          {
            assignmentId: `A-${userId}`,
            roleCode,
            institutionId,
            validFrom: "2026-01-01T00:00:00.000Z",
            validTo: null,
          },
        ]
      : [],
  };
}
function createServices(
  documentGateway = new UnavailableApplicationDocumentGateway(),
) {
  const authDecisions = new AuthorizationDecisionService();
  const institutions = new InstitutionsService(
    new InstitutionAuthorizationService(authDecisions),
    new PrototypeAuditService(),
  );
  const central = user("PG-CENTRAL", "CGA");
  const institutionAdmin = user("PG-INST-ADMIN", "UA");
  institutions.createInstitution(
    {
      institutionId: INST,
      code: "PG-UNIV",
      nameAr: "جامعة التكامل",
      type: "University",
      status: "Active",
    },
    central,
  );
  institutions.createOrgUnit(
    INST,
    {
      orgUnitId: "PG-OU",
      type: "College",
      nameAr: "كلية الدراسات",
      status: "Active",
      effectiveFrom: "2026-01-01",
    },
    institutionAdmin,
  );
  institutions.createProgramVersion(
    INST,
    {
      programId: PROGRAM,
      orgUnitId: "PG-OU",
      degreeLevel: "Master",
      nameAr: "ماجستير",
      status: "Active",
      effectiveFrom: "2026-01-01",
      thesisRequired: true,
      versionNo: 1,
    },
    institutionAdmin,
  );
  const references = new AcademicReferenceService(institutions);
  const persons = new PersonIdentityService();
  const auth = new AcademicAuthorizationService(authDecisions);
  const audit = new AcademicAuditService(new ResearchAuditService());
  const applicants = new ApplicantService(persons, auth, audit);
  const notifications = new ApplicationNotificationOutboxService();
  // Use the *default* fail-closed production boundary; the empty document
  // requirements fixture allows the basic application workflow to be checked.
  const workflows = new ApplicationWorkflowService(
    applicants,
    persons,
    references,
    auth,
    audit,
    documentGateway,
    notifications,
    new BusinessPolicyService({
      get: () => path.join(__dirname, "../config/policies.json"),
    }),
    new AdmissionDecisionEvidenceService(references, persons),
  );
  const policies = new EnrollmentPolicyService(references, auth, audit);
  const enrollments = new EnrollmentLifecycleService(
    workflows,
    applicants,
    persons,
    references,
    auth,
    audit,
    policies,
    new UnavailableDegreeReadinessGateway(),
  );
  return {
    institutions,
    references,
    persons,
    auth,
    audit,
    applicants,
    workflows,
    notifications,
    policies,
    enrollments,
  };
}
async function main() {
  const s = createServices();
  const applicant = user("PG-WF-APPLICANT");
  const other = user("PG-WF-OTHER");
  const officer = user("PG-WF-OFFICER", "PGO");
  const approver = user("PG-WF-APPROVER", "PGA");
  const outside = user("PG-WF-OUTSIDE", "PGA", "INST-OTHER");
  s.applicants.registerSelf({ fullNameAr: "متقدم أول" }, applicant);
  s.applicants.registerSelf({ fullNameAr: "متقدم ثان" }, other);
  const draft = s.workflows.createDraft(
    { programId: PROGRAM, admissionCycleId: CYCLE },
    applicant,
  );

  await check(
    "TC-FR-010/TC-BR-006",
    "Scoped draft is anchored to canonical INS program and cycle",
    () => {
      assert.equal(draft.institutionId, INST);
      assert.equal(draft.status, "Draft");
      assert.throws(() =>
        s.workflows.createDraft(
          { programId: PROGRAM, admissionCycleId: CYCLE },
          applicant,
        ),
      );
    },
  );
  await check(
    "TC-FR-010/NFR-025",
    "Unrelated applicant / institution cannot read or edit a draft",
    () => {
      assert.throws(() => s.workflows.getOne(draft.applicationId, other));
      assert.throws(() =>
        s.workflows.correctFields(
          draft.applicationId,
          { programId: PROGRAM },
          other,
        ),
      );
      assert.throws(() => s.workflows.getOne(draft.applicationId, outside));
    },
  );
  await check(
    "TC-FR-029/TC-NFR-029",
    "A user-supplied document reference cannot bypass the unavailable scanner",
    async () => {
      await assert.rejects(
        () =>
          s.workflows.linkDocument(
            draft.applicationId,
            { documentId: "CLAIMED-CLEAN", purpose: "Transcript" },
            applicant,
          ),
        (e) => e.status === 503,
      );
      assert.equal(
        s.workflows.getOne(draft.applicationId, applicant).attachedDocuments
          .length,
        0,
      );
    },
  );
  const initial = await s.workflows.submitDraft(draft.applicationId, applicant);
  await check(
    "TC-FR-010/TC-BR-006/TC-FR-030",
    "Submitted snapshot is immutable and notification stays Pending",
    () => {
      assert.equal(initial.status, "Submitted");
      assert.equal(initial.submissions.length, 1);
      assert.equal(initial.submissions[0].programVersionNo, 1);
      assert.equal(
        s.notifications.pendingForDelivery().at(-1).deliveryStatus,
        "Pending",
      );
      assert.throws(() =>
        s.workflows.correctFields(
          draft.applicationId,
          { programId: PROGRAM },
          applicant,
        ),
      );
    },
  );
  await check("TC-FR-011", "Only properly scoped staff start review", () => {
    assert.throws(() => s.workflows.startReview(draft.applicationId, outside));
    assert.equal(
      s.workflows.startReview(draft.applicationId, officer).status,
      "UnderReview",
    );
    assert.throws(() =>
      s.workflows.recordReview(
        draft.applicationId,
        { reviewType: "Eligibility", comments: "غير مصرح" },
        outside,
      ),
    );
  });
  await check(
    "TC-FR-011/TC-BR-007",
    "Review rejects missing justification",
    () => {
      assert.throws(() =>
        s.workflows.recordReview(
          draft.applicationId,
          { reviewType: "Eligibility", recommendation: "Reject" },
          officer,
        ),
      );
      assert.equal(
        s.workflows.recordReview(
          draft.applicationId,
          {
            reviewType: "Eligibility",
            recommendation: "Approve",
            comments: "بيانات صحيحة",
          },
          officer,
        ).reviews.length,
        1,
      );
    },
  );
  await check(
    "TC-BR-041",
    "NeedMoreInfo requires a reason and authorized assigned officer",
    () => {
      assert.throws(() =>
        s.workflows.requestMoreInfo(
          draft.applicationId,
          { reason: "", requestedFields: ["programId"] },
          officer,
        ),
      );
      assert.throws(() =>
        s.workflows.requestMoreInfo(
          draft.applicationId,
          { reason: "تصحيح", requestedFields: ["programId"] },
          outside,
        ),
      );
      assert.equal(
        s.workflows.requestMoreInfo(
          draft.applicationId,
          {
            reason: "ارفاق وثيقة مستكملة",
            requestedDocumentPurposes: ["Transcript"],
          },
          officer,
        ).status,
        "NeedMoreInfo",
      );
    },
  );
  await check(
    "TC-BR-041/TC-FR-029",
    "Resubmission cannot claim an unverified document correction",
    async () => {
      await assert.rejects(() =>
        s.workflows.resubmit(draft.applicationId, applicant),
      );
      await assert.rejects(() =>
        s.workflows.linkDocument(
          draft.applicationId,
          { documentId: "DOC-NO-SCAN", purpose: "Transcript" },
          applicant,
        ),
      );
      assert.equal(
        s.workflows.getOne(draft.applicationId, applicant).status,
        "NeedMoreInfo",
      );
    },
  );

  // Use another applicant for an accept/enrollment path, since the first
  // applicant's reviewed application remains securely fail-closed on documents.
  const acceptedDraft = s.workflows.createDraft(
    { programId: PROGRAM, admissionCycleId: CYCLE },
    other,
  );
  await s.workflows.submitDraft(acceptedDraft.applicationId, other);
  s.workflows.startReview(acceptedDraft.applicationId, officer);
  await check(
    "TC-FR-012/TC-BR-007",
    "An admission decision requires a review and a reason",
    () => {
      assert.throws(() =>
        s.workflows.decide(
          acceptedDraft.applicationId,
          { outcome: "Accepted", reason: "قبول" },
          approver,
        ),
      );
      s.workflows.recordReview(
        acceptedDraft.applicationId,
        { reviewType: "Academic", recommendation: "Approve", comments: "مؤهل" },
        officer,
      );
      assert.throws(() =>
        s.workflows.decide(
          acceptedDraft.applicationId,
          { outcome: "Rejected", reason: "" },
          approver,
        ),
      );
    },
  );
  const condition = s.workflows.decide(
    acceptedDraft.applicationId,
    {
      outcome: "ConditionalAccepted",
      reason: "قبول مشروط",
      conditions: "مطابقة الشهادة",
    },
    approver,
  );
  await check(
    "TC-FR-012/TC-BR-008",
    "Conditional admission cannot directly create an enrollment",
    () => {
      assert.equal(condition.status, "UnderReview");
      assert.throws(() =>
        s.workflows.admissionEvidenceForEnrollment(
          acceptedDraft.applicationId,
          {
            personId: other.personId,
            institutionId: INST,
            programId: PROGRAM,
            admissionCycleId: CYCLE,
            startDate: "2026-10-01",
          },
          officer,
        ),
      );
      assert.equal(
        s.workflows.clearAdmissionConditions(
          acceptedDraft.applicationId,
          { clearanceEvidence: "تم التحقق" },
          approver,
        ).status,
        "Accepted",
      );
    },
  );
  await check(
    "TC-BR-008",
    "Admission evidence fails on wrong trusted target",
    () => {
      assert.throws(() =>
        s.workflows.admissionEvidenceForEnrollment(
          acceptedDraft.applicationId,
          {
            personId: applicant.personId,
            institutionId: INST,
            programId: PROGRAM,
            admissionCycleId: CYCLE,
            startDate: "2026-10-01",
          },
          officer,
        ),
      );
    },
  );
  await check(
    "TC-FR-013/TC-BR-004",
    "Enrollment requires trusted SIS Student mapping",
    () => {
      assert.throws(() =>
        s.enrollments.create(
          {
            applicationId: acceptedDraft.applicationId,
            startDate: "2026-10-01",
            academicYear: YEAR,
          },
          officer,
        ),
      );
      s.applicants.acceptTrustedStudentUpsert({
        personId: other.personId,
        institutionId: INST,
        sourceSystem: "TEST-SIS",
        externalStudentId: "STU-PG-WF-OTHER",
        academicStatus: "Active",
        lastSourceUpdateAt: "2026-10-10T00:00:00.000Z",
      });
    },
  );
  await check(
    "TC-FR-043/TC-BR-052/TC-BR-062",
    "Only authority approves explicit effective-dated enrollment policy",
    () => {
      const input = {
        programId: PROGRAM,
        scopeType: "Program",
        scopeId: PROGRAM,
        versionNo: 1,
        value: {
          normalStudyMonths: 12,
          maxStudyMonths: 24,
          maxExtensions: 1,
          maxExtensionMonths: 6,
        },
      };
      assert.throws(() => s.policies.approve(input, officer));
      assert.equal(s.policies.approve(input, approver).versionNo, 1);
    },
  );
  let failedAudit = false;
  const originalAuditRecord = s.audit.record.bind(s.audit);
  s.audit.record = (...args) => {
    if (failedAudit) throw new Error("injected audit persistence failure");
    return originalAuditRecord(...args);
  };
  const future = "2027-02-01T00:00:00.000Z";
  const nextPolicy = {
    programId: PROGRAM,
    scopeType: "Program",
    scopeId: PROGRAM,
    versionNo: 2,
    effectiveFrom: future,
    value: {
      normalStudyMonths: 18,
      maxStudyMonths: 30,
      maxExtensions: 2,
      maxExtensionMonths: 6,
    },
  };
  await check(
    "TC-NFR-014/TC-BR-062",
    "Failed policy audit cannot truncate the previous version",
    () => {
      failedAudit = true;
      assert.throws(
        () => s.policies.approve(nextPolicy, approver),
        /injected audit/,
      );
      failedAudit = false;
      assert.equal(
        s.policies.applicable(
          PROGRAM,
          CYCLE,
          new Date("2027-03-01T00:00:00.000Z"),
        ).versionNo,
        1,
      );
      assert.equal(s.policies.approve(nextPolicy, approver).versionNo, 2);
      assert.equal(
        s.policies.applicable(
          PROGRAM,
          CYCLE,
          new Date("2027-01-01T00:00:00.000Z"),
        ).versionNo,
        1,
      );
      assert.equal(
        s.policies.applicable(
          PROGRAM,
          CYCLE,
          new Date("2027-03-01T00:00:00.000Z"),
        ).versionNo,
        2,
      );
    },
  );
  const enrollment = s.enrollments.create(
    {
      applicationId: acceptedDraft.applicationId,
      startDate: "2026-10-01",
      academicYear: YEAR,
    },
    officer,
  );
  await check(
    "TC-FR-013/TC-BR-008",
    "Accepted + mapped Student + approved policy yield pinned Active enrollment",
    () => {
      assert.equal(enrollment.status, "Active");
      assert.equal(enrollment.policyValueSnapshot.normalStudyMonths, 12);
      assert.equal(
        enrollment.submissionSnapshotId,
        condition.submissions.at(-1).snapshotId,
      );
      assert.throws(() =>
        s.enrollments.create(
          {
            applicationId: acceptedDraft.applicationId,
            startDate: "2026-10-01",
            academicYear: YEAR,
          },
          officer,
        ),
      );
    },
  );
  await check(
    "TC-BR-052",
    "Study extension enforces configured maximums",
    () => {
      assert.throws(() =>
        s.enrollments.extend(
          enrollment.enrollmentId,
          { months: 7, reason: "تمديد" },
          approver,
        ),
      );
      const extended = s.enrollments.extend(
        enrollment.enrollmentId,
        { months: 5, reason: "تمديد مبرر" },
        approver,
      );
      assert.equal(extended.decisions.at(-1).operation, "Extend");
      assert.throws(() =>
        s.enrollments.extend(
          enrollment.enrollmentId,
          { months: 1, reason: "مكرر" },
          approver,
        ),
      );
    },
  );
  await check(
    "TC-BR-053/TC-FR-045",
    "Suspension and resume append state history",
    () => {
      assert.equal(
        s.enrollments.suspend(
          enrollment.enrollmentId,
          { reason: "إجازة" },
          approver,
        ).status,
        "Suspended",
      );
      assert.equal(
        s.enrollments.resume(
          enrollment.enrollmentId,
          { reason: "استئناف" },
          approver,
        ).status,
        "Active",
      );
      const snapshot = s.enrollments.statusAsOf(
        enrollment.enrollmentId,
        new Date(Date.now() + 1000).toISOString(),
        officer,
      );
      assert.equal(snapshot.status, "Active");
      assert.ok(snapshot.history.length >= 3);
    },
  );
  await check(
    "TC-BR-054",
    "Unconfigured degree-readiness gate refuses to award degree",
    async () => {
      await assert.rejects(
        () =>
          s.enrollments.approveDegree(
            enrollment.enrollmentId,
            { reason: "تخرج" },
            approver,
          ),
        (e) => e.status === 503,
      );
      assert.equal(
        s.enrollments.getOne(enrollment.enrollmentId, officer).status,
        "Active",
      );
    },
  );
  await check(
    "TC-BR-053/TC-BR-009",
    "Withdrawal and independent re-enrollment retain the old record",
    () => {
      assert.equal(
        s.enrollments.withdraw(
          enrollment.enrollmentId,
          { reason: "انسحاب" },
          approver,
        ).status,
        "Withdrawn",
      );
      const next = s.enrollments.reEnroll(
        enrollment.enrollmentId,
        {
          applicationId: acceptedDraft.applicationId,
          startDate: "2026-10-10",
          academicYear: YEAR,
          reason: "عودة موثقة",
        },
        approver,
      );
      assert.equal(next.priorEnrollmentId, enrollment.enrollmentId);
      assert.notEqual(next.enrollmentId, enrollment.enrollmentId);
      assert.equal(
        s.enrollments.getOne(enrollment.enrollmentId, officer).status,
        "Withdrawn",
      );
      assert.throws(() =>
        s.enrollments.reEnroll(
          enrollment.enrollmentId,
          {
            applicationId: acceptedDraft.applicationId,
            startDate: "2026-10-10",
            academicYear: YEAR,
            reason: "تكرار",
          },
          approver,
        ),
      );
    },
  );
  // Separate unit-double for Document Service: tests the review iteration
  // boundary without pretending the real scanner/storage is integrated.
  const isolated = createServices({
    async assertLinkable(input) {
      assert.equal(input.targetType, "PostgraduateApplication");
      assert.equal(input.institutionId, INST);
      assert.equal(input.purpose, "Transcript");
      assert.equal(input.documentId, "TEST-VERIFIED-DOC");
    },
  });
  const retryApplicant = user("PG-WF-RESUBMIT");
  isolated.applicants.registerSelf(
    { fullNameAr: "متقدم مستكمل" },
    retryApplicant,
  );
  const resubDraft = isolated.workflows.createDraft(
    { programId: PROGRAM, admissionCycleId: CYCLE },
    retryApplicant,
  );
  const first = await isolated.workflows.submitDraft(
    resubDraft.applicationId,
    retryApplicant,
  );
  isolated.workflows.startReview(resubDraft.applicationId, officer);
  isolated.workflows.recordReview(
    resubDraft.applicationId,
    {
      reviewType: "Academic",
      recommendation: "Approve",
      comments: "مراجعة النسخة الأولى",
    },
    officer,
  );
  isolated.workflows.requestMoreInfo(
    resubDraft.applicationId,
    {
      reason: "الرجاء تجديد النسخة",
      requestedDocumentPurposes: ["Transcript"],
    },
    officer,
  );
  await isolated.workflows.linkDocument(
    resubDraft.applicationId,
    { documentId: "TEST-VERIFIED-DOC", purpose: "Transcript" },
    retryApplicant,
  );
  const resent = await isolated.workflows.resubmit(
    resubDraft.applicationId,
    retryApplicant,
  );
  await check(
    "TC-BR-041/TC-NFR-021",
    "Resubmission creates a new snapshot while retaining first submission",
    () => {
      assert.equal(resent.status, "Submitted");
      assert.equal(resent.firstSubmittedAt, first.firstSubmittedAt);
      assert.equal(resent.submissions.length, 2);
      assert.equal(
        resent.submissions[0].snapshotId,
        first.submissions[0].snapshotId,
      );
      assert.notEqual(
        resent.submissions[1].snapshotId,
        resent.submissions[0].snapshotId,
      );
      assert.equal(resent.needMoreInfoIntervals.length, 1);
      assert.ok(resent.resubmittedAt);
      assert.equal(
        resent.reviews[0].submissionSnapshotId,
        first.submissions[0].snapshotId,
      );
    },
  );
  await check(
    "TC-FR-011/TC-BR-041",
    "Old review does not authorize deciding on a resubmitted snapshot",
    () => {
      isolated.workflows.startReview(resubDraft.applicationId, officer);
      assert.throws(
        () =>
          isolated.workflows.decide(
            resubDraft.applicationId,
            { outcome: "Accepted", reason: "قبول" },
            approver,
          ),
        /latest submission/,
      );
      const reviewed = isolated.workflows.recordReview(
        resubDraft.applicationId,
        {
          reviewType: "Academic",
          recommendation: "Approve",
          comments: "مراجعة الإعادة",
        },
        officer,
      );
      assert.equal(
        reviewed.reviews.at(-1).submissionSnapshotId,
        resent.submissions[1].snapshotId,
      );
      assert.equal(
        isolated.workflows.decide(
          resubDraft.applicationId,
          { outcome: "Accepted", reason: "استوفت الشروط" },
          approver,
        ).status,
        "Accepted",
      );
    },
  );
  console.log(
    `PG002–PG005 FOCUSED DOMAIN CHECKS PASSED (${checks} checks; shared integrations pending)`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
