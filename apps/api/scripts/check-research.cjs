const {
  PersonIdentityService,
} = require("../dist/research/domain/person-identity.service.js");
const {
  ProposalService,
} = require("../dist/research/domain/proposal.service.js");
const {
  ProjectService,
} = require("../dist/research/domain/project.service.js");

function assert(condition, testId, message) {
  if (!condition) {
    throw new Error(`${testId}: ${message}`);
  }
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

function main() {
  console.log(
    "=== Checking Phase 06 Research Tasks (TASK-RS-001, TASK-RS-002, TASK-RS-003, TASK-RS-006) ===",
  );

  // -------------------------------------------------------------
  // 1. TASK-RS-001: Researcher Profile & Identity Merge (FR-021, FR-042, BR-055, NFR-025)
  // -------------------------------------------------------------
  const identityService = new PersonIdentityService();

  const researcher = identityService.getResearcher("RES-101");
  assert(
    researcher.personId === "P-101" &&
      researcher.orcid === "0000-0002-1825-0097",
    "TC-FR-021",
    "Researcher profile manages academic title, affiliation and external identifiers",
  );

  const maskedPerson = identityService.getPerson("P-101");
  assert(
    maskedPerson.nationalIdentifier.includes("***"),
    "TC-NFR-025",
    "Sensitive national identifier is masked when retrieved (privacy requirement)",
  );

  // Test Person Identity Merge (FR-042 / BR-055)
  const mergeResult = identityService.mergePersonIdentities({
    sourcePersonId: "P-102",
    targetPersonId: "P-101",
    stewardUserId: "STEWARD-001",
    reason: "Duplicate identity resolution",
  });

  assert(
    mergeResult.mergedTargetPersonId === "P-101" &&
      mergeResult.remappedRecordsCount > 0,
    "TC-FR-042",
    "Data Steward successfully merges duplicate person identity and remaps records",
  );

  const sourcePersonArchived = identityService.getPerson("P-102");
  assert(
    sourcePersonArchived.status === "Archived",
    "TC-BR-055",
    "Merged source Person status is set to Archived while retaining identity root reference",
  );

  // -------------------------------------------------------------
  // 2. TASK-RS-002: Research Proposal & Conflict of Interest (FR-022, FR-023, BR-021, BR-022, BR-049, BR-061)
  // -------------------------------------------------------------
  const projectService = new ProjectService();
  const proposalService = new ProposalService(identityService, projectService);

  const proposal = proposalService.createProposal({
    principalResearcherId: "RES-101",
    title: "Distributed Quantum Key Distribution Protocol",
    abstract:
      "Quantum cryptography application for university network integration",
    initialBudget: 200000,
  });

  assert(
    proposal.status === "Draft",
    "TC-FR-022",
    "Research proposal created in Draft status",
  );

  const submittedProposal = proposalService.submitProposal(proposal.proposalId);
  assert(
    submittedProposal.status === "Submitted",
    "TC-FR-022",
    "Research proposal submitted for review",
  );

  // BR-021 / BR-061: Proposer (PI) self-review blocked
  expectThrow(
    () =>
      proposalService.assignReviewer({
        proposalId: proposal.proposalId,
        reviewerId: "RES-101", // Same PI
      }),
    "TC-BR-021",
    "BR-021/BR-061: Proposer PI cannot be assigned to review their own proposal",
  );

  // Assign Reviewer with COI check (BR-022 / BR-061)
  const reviewRecord = proposalService.assignReviewer({
    proposalId: proposal.proposalId,
    reviewerId: "RES-102",
    hasDeclaredConflict: true, // Declared conflict
  });

  assert(
    reviewRecord.conflictStatus === "Conflict",
    "TC-BR-061",
    "Conflict of Interest recorded on reviewer assignment when disclosure declared",
  );

  expectThrow(
    () =>
      proposalService.submitReview({
        reviewId: reviewRecord.reviewId,
        score: 95,
        recommendation: "Approve",
      }),
    "TC-BR-022",
    "BR-022: Conflicted reviewer is blocked from submitting evaluation",
  );

  // BR-021 & BR-049: Proposer cannot issue decision, Approval auto-creates Project
  expectThrow(
    () =>
      proposalService.issueDecision({
        proposalId: proposal.proposalId,
        decision: "Approved",
        decisionByResearcherId: "RES-101", // Proposer
      }),
    "TC-BR-021",
    "BR-021: Decision cannot be issued by the proposal PI",
  );

  const approvedProposal = proposalService.issueDecision({
    proposalId: proposal.proposalId,
    decision: "Approved",
    decisionByResearcherId: "RES-999", // Authorized Officer
  });

  assert(
    approvedProposal.status === "Approved" &&
      approvedProposal.createdProjectId !== undefined,
    "TC-BR-049",
    "BR-049: Approved research proposal automatically creates default Research Project",
  );

  // -------------------------------------------------------------
  // 3. TASK-RS-003 & TASK-RS-006: Project Lifecycle & Outputs (FR-024, FR-027, BR-020, BR-050, UC-11)
  // -------------------------------------------------------------
  const createdProject = projectService.getProject(
    approvedProposal.createdProjectId,
  );
  assert(
    createdProject.status === "Active" && createdProject.leaderId === "RES-101",
    "TC-FR-024",
    "Created Research Project is active with assigned Leader PI",
  );

  // BR-050: Leader/Scope Amendment Request
  const amendment = projectService.requestAmendment({
    projectId: createdProject.projectId,
    requestedBy: "RES-101",
    type: "Extension",
    reason: "Additional validation experiment needed",
    newEndDate: "2027-06-30",
  });

  assert(
    amendment.status === "Pending",
    "TC-BR-050",
    "BR-050: Project extension request logged as pending AmendmentRequest",
  );

  projectService.decideAmendment({
    amendmentId: amendment.amendmentId,
    decision: "Approved",
    decidedBy: "OFFICER-001",
  });

  const updatedProj = projectService.getProject(createdProject.projectId);
  assert(
    updatedProj.endDate === "2027-06-30",
    "TC-BR-050",
    "Approved Amendment updates project end date without overwriting past history",
  );

  // UC-11: Cannot mark completed without accepted outputs
  expectThrow(
    () =>
      projectService.updateProjectStatus(createdProject.projectId, "Completed"),
    "TC-UC-11",
    "UC-11: Cannot set project status to Completed without registered research outputs",
  );

  projectService.registerOutput({
    projectId: createdProject.projectId,
    outputType: "Report",
    title: "Final Quantum Protocol Specification Document",
  });

  const completedProj = projectService.updateProjectStatus(
    createdProject.projectId,
    "Completed",
  );
  assert(
    completedProj.status === "Completed",
    "TC-FR-027",
    "Project successfully completed after registering research outputs",
  );

  console.log("\nPhase 06 Research tasks verification check passed.");
}

main();
