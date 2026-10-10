const fs = require("node:fs");
const path = require("node:path");

const {
  AuthorizationDecisionService,
} = require("../dist/identity/authorization/authorization-decision.service.js");
const {
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  ResearchAuthorizationService,
} = require("../dist/research/domain/research-authorization.service.js");
const {
  ResearchAuditService,
} = require("../dist/research/domain/research-audit.service.js");
const {
  ConflictOfInterestService,
} = require("../dist/research/domain/conflict-of-interest.service.js");
const {
  ProjectService,
} = require("../dist/research/domain/project.service.js");
const {
  ProposalService,
} = require("../dist/research/domain/proposal.service.js");

function assert(condition, testId, message) {
  if (!condition) throw new Error(`${testId}: ${message}`);
  console.log(`PASS ${testId}: ${message}`);
}

function expectThrow(fn, testId, message) {
  let thrown = false;
  try {
    fn();
  } catch {
    thrown = true;
  }
  assert(thrown, testId, message);
}

function principal({
  userId,
  personId,
  roleCode,
  institutionId = "INST-001",
  dataScopes = [],
}) {
  const assignmentId = `A-${userId}-${roleCode}`;
  return {
    userId,
    personId,
    authenticated: true,
    roleAssignments: [
      {
        assignmentId,
        roleCode,
        institutionId,
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
    dataScopes: dataScopes.map((scope) => ({ assignmentId, ...scope })),
  };
}

function main() {
  console.log("=== Corrective verification: Phase 06 Research ===");

  const decisions = new AuthorizationDecisionService();
  const authorization = new ResearchAuthorizationService(decisions);
  const audit = new ResearchAuditService();
  const policies = {
    getPolicyAt() {
      return {
        policyVersion: "test-2026.1",
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: null,
        values: { "research.coi.recentCoauthorshipMonths": 24 },
      };
    },
  };
  const conflicts = new ConflictOfInterestService(policies);
  const identity = new PersonIdentityService();
  const projects = new ProjectService(authorization, audit);
  const proposals = new ProposalService(
    identity,
    projects,
    authorization,
    conflicts,
    audit,
  );

  const piOperator = principal({
    userId: "U-PI",
    personId: "P-101",
    roleCode: "RO",
  });
  const reviewer = principal({
    userId: "U-REV",
    personId: "P-103",
    roleCode: "RO",
  });
  const authority = principal({
    userId: "U-RA",
    personId: "P-999",
    roleCode: "RA",
  });
  const piAuthority = principal({
    userId: "U-PI-RA",
    personId: "P-101",
    roleCode: "RA",
  });
  const wrongInstitution = principal({
    userId: "U-B",
    personId: "P-B",
    roleCode: "RO",
    institutionId: "INST-002",
  });
  const steward = principal({
    userId: "U-DS",
    personId: "P-DS",
    roleCode: "DS",
    institutionId: null,
    dataScopes: [
      { type: "Person", id: "P-101" },
      { type: "Person", id: "P-102" },
    ],
  });

  // RS-001 / FR-021 / FR-042 / BR-055 / NFR-025
  const masked = identity.getPerson("P-101");
  assert(
    masked.nationalIdentifier.includes("***"),
    "TC-NFR-025",
    "National identifier fingerprint is masked in returned Person data",
  );
  assert(
    identity.findMatchingPersons({ birthDate: "1988-04-12" }).length === 0,
    "TC-BR-055",
    "Birth date alone is not treated as a trusted identity match",
  );
  assert(
    identity.findMatchingPersons({
      email: "sumaya.khaled@university.edu",
      birthDate: "1988-04-12",
    }).length === 1,
    "TC-FR-042",
    "Supporting email+birthDate evidence can produce a candidate match",
  );
  authorization.assertIdentitySteward(steward, "P-102");
  authorization.assertIdentitySteward(steward, "P-101");
  assert(
    authorization.canResolvePerson(steward, "P-101") &&
      authorization.canResolvePerson(steward, "P-102") &&
      !authorization.canResolvePerson(steward, "P-103"),
    "TC-NFR-025",
    "Data Steward Person access remains bounded to assignment-scoped Person claims",
  );
  const merged = identity.mergePersonIdentities(
    {
      sourcePersonId: "P-102",
      targetPersonId: "P-101",
      reason: "Verified duplicate candidate",
    },
    steward.userId,
  );
  assert(
    identity.getPerson("P-102").status === "Archived",
    "TC-FR-042",
    "Data Steward merge archives duplicate source Person while preserving audit",
  );
  identity.unmergePersonIdentities(
    { auditId: merged.auditId, reason: "Correction after evidence review" },
    steward.userId,
  );
  assert(
    identity.getPerson("P-102").status === "Active",
    "TC-FR-042",
    "Controlled unmerge restores the previous identity mapping state",
  );
  expectThrow(
    () => identity.verifyResearcherOrcid("RES-102", "0000-0002-1825-0097"),
    "TC-BR-025",
    "Verified ORCID cannot be owned by two researcher/person identities",
  );
  expectThrow(
    () => authorization.assertResearchOperation(wrongInstitution, "INST-001"),
    "TC-NFR-008-RS",
    "Research operation denies a role outside the resource institution scope",
  );

  // RS-002 / proposal lifecycle / COI / decision separation
  const proposal = proposals.createProposal(
    {
      principalResearcherId: "RES-101",
      title: "Source-aligned research proposal",
      abstract:
        "A prototype proposal used to verify the canonical research flow.",
      initialBudget: 1000,
    },
    piOperator,
  );
  assert(proposal.status === "Draft", "TC-FR-022", "Proposal starts in Draft");
  const submitted = proposals.submitProposal(proposal.proposalId, piOperator);
  assert(
    submitted.status === "Submitted",
    "TC-FR-022",
    "Draft proposal submits to Submitted",
  );
  expectThrow(
    () =>
      proposals.assignReviewer(
        {
          proposalId: proposal.proposalId,
          reviewerId: "RES-102",
          hasDeclaredConflict: false,
        },
        piOperator,
      ),
    "TC-FR-023",
    "Reviewer cannot be assigned before the explicit Screening operation",
  );
  proposals.screenProposal(proposal.proposalId, piOperator);
  expectThrow(
    () =>
      proposals.assignReviewer(
        { proposalId: proposal.proposalId, reviewerId: "RES-102" },
        piOperator,
      ),
    "TC-BR-061",
    "Manual conflict disclosure is mandatory",
  );
  const selfConflict = proposals.assignReviewer(
    {
      proposalId: proposal.proposalId,
      reviewerId: "RES-101",
      hasDeclaredConflict: false,
    },
    piOperator,
  );
  assert(
    selfConflict.conflictStatus === "Conflict",
    "TC-BR-061",
    "Self-review is recorded as a conflict",
  );
  expectThrow(
    () =>
      proposals.submitReview(
        {
          reviewId: selfConflict.reviewId,
          score: 10,
          recommendation: "Reject",
        },
        piOperator,
      ),
    "TC-BR-022",
    "Conflicted reviewer cannot submit an evaluation",
  );

  const clearReview = proposals.assignReviewer(
    {
      proposalId: proposal.proposalId,
      reviewerId: "RES-102",
      hasDeclaredConflict: false,
    },
    piOperator,
  );
  assert(
    clearReview.conflictStatus === "Clear",
    "TC-BR-061",
    "Clear reviewer assignment proceeds under the configured COI policy",
  );
  expectThrow(
    () =>
      proposals.submitReview(
        {
          reviewId: clearReview.reviewId,
          score: 90,
          recommendation: "Approve",
        },
        piOperator,
      ),
    "TC-FR-023",
    "A different user cannot submit the assigned review",
  );
  proposals.submitReview(
    {
      reviewId: clearReview.reviewId,
      score: 90,
      recommendation: "Approve",
    },
    reviewer,
  );
  expectThrow(
    () =>
      proposals.issueDecision(
        { proposalId: proposal.proposalId, decision: "Approved" },
        piAuthority,
      ),
    "TC-BR-021",
    "Proposal PI cannot issue the decision even when the user holds RA",
  );
  const approved = proposals.issueDecision(
    { proposalId: proposal.proposalId, decision: "Approved" },
    authority,
  );
  assert(
    approved.status === "Approved" && Boolean(approved.createdProjectId),
    "TC-BR-049",
    "Approved proposal creates one default project",
  );
  assert(
    projects.countProjectsForProposal(proposal.proposalId) === 1,
    "TC-BR-049",
    "Approved proposal has exactly one default project",
  );

  // BR-061 evidence categories and PolicyConfiguration dependency.
  conflicts.registerDirectSupervisionEvidence({
    leftResearcherId: "RES-101",
    rightResearcherId: "RES-102",
  });
  assert(
    conflicts.evaluate({
      principalResearcherId: "RES-101",
      reviewerId: "RES-102",
      hasDeclaredConflict: false,
    }).conflict,
    "TC-BR-061",
    "Direct supervision evidence is treated as a COI",
  );

  // RS-003 / RS-006 / BR-020 / BR-050 / NFR-014
  const projectId = approved.createdProjectId;
  const createdProject = projects.getProject(projectId);
  assert(
    createdProject.status === "Planned",
    "TC-FR-024",
    "Project created from an approved proposal starts Planned until its period is complete",
  );
  expectThrow(
    () => projects.transitionProject(projectId, "Active", piOperator),
    "TC-BR-020",
    "Project cannot become Active without a defined end date",
  );
  projects.transitionProject(projectId, "Active", piOperator, {
    endDate: "2027-12-31",
  });
  expectThrow(
    () => projects.transitionProject(projectId, "Archived", piOperator),
    "TC-FR-024",
    "Unlisted ResearchProject state transition fails closed",
  );

  const beforeInvalidAmendment = projects.getProjectAmendments(
    projectId,
    piOperator,
  ).length;
  expectThrow(
    () =>
      projects.requestAmendment(
        {
          projectId,
          changeType: "Duration",
          reason: "Invalid backwards duration",
          newEndDate: "2025-01-01",
        },
        piOperator,
      ),
    "TC-NFR-014",
    "Invalid amendment leaves no partial AmendmentRequest record",
  );
  assert(
    projects.getProjectAmendments(projectId, piOperator).length ===
      beforeInvalidAmendment,
    "TC-NFR-014",
    "Failed multi-record operation preserves atomic prototype state",
  );

  const amendment = projects.requestAmendment(
    {
      projectId,
      changeType: "Duration",
      reason: "Approved research extension",
      newEndDate: "2028-06-30",
    },
    piOperator,
  );
  projects.beginAmendmentReview(amendment.amendmentId, authority);
  projects.decideAmendment(amendment.amendmentId, "Approved", authority);
  const applied = projects.applyAmendment(amendment.amendmentId, authority);
  assert(
    applied.status === "Applied" &&
      projects.getProject(projectId).endDate === "2028-06-30",
    "TC-BR-050",
    "Approved RA amendment changes duration while retaining AmendmentRequest history",
  );

  const output = projects.registerOutput(
    {
      projectId,
      outputType: "Report",
      title: "Final research report",
    },
    piOperator,
  );
  assert(
    output.status === "Submitted",
    "TC-FR-027",
    "New research output is registered without being auto-accepted",
  );
  expectThrow(
    () => projects.transitionProject(projectId, "Completed", piOperator),
    "TC-UC-11",
    "Project cannot complete before an output is accepted",
  );
  projects.acceptOutput(projectId, output.outputId, piOperator);
  assert(
    projects.transitionProject(projectId, "Completed", piOperator).status ===
      "Completed",
    "TC-FR-027",
    "Project completes after required period and accepted output are present",
  );

  assert(
    audit.list().length > 0 && audit.verifyChain(),
    "TC-NFR-011",
    "Research sensitive operations produce a correlation-aware tamper-evident hash chain",
  );

  // RS-004 / RS-005 are DOCUMENTATION_ONLY and must have concrete deliverables.
  const root = path.resolve(__dirname, "../../..");
  assert(
    fs.existsSync(path.join(root, "docs/43_rs004_members_leader_boundary.md")),
    "TC-FR-025",
    "RS-004 DOCUMENTATION_ONLY boundary is documented",
  );
  assert(
    fs.existsSync(path.join(root, "docs/44_rs005_funding_boundary.md")),
    "TC-FR-026",
    "RS-005 DOCUMENTATION_ONLY funding/Finance boundary is documented",
  );

  console.log("\nCorrective Phase 06 research verification passed.");
}

main();
