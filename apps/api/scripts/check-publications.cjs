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
  PublicationService,
} = require("../dist/publications/domain/publication.service.js");

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

function principal(userId, personId, institutionId = "INST-001") {
  return {
    userId,
    personId,
    authenticated: true,
    roleAssignments: [
      {
        assignmentId: `A-${userId}`,
        roleCode: "RO",
        institutionId,
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
      },
    ],
  };
}

function main() {
  console.log("=== Corrective verification: Phase 07 Publications 001-003 ===");
  const authorization = new ResearchAuthorizationService(
    new AuthorizationDecisionService(),
  );
  const identity = new PersonIdentityService();
  const audit = new ResearchAuditService();
  const service = new PublicationService(identity, authorization, audit);
  const operator = principal("U-RO", "P-103");
  const otherInstitution = principal("U-B", "P-B", "INST-002");

  expectThrow(
    () =>
      service.registerPublication(
        { title: "No authors", type: "Article", authors: [] },
        operator,
      ),
    "TC-BR-024",
    "Publication without authors is rejected",
  );
  expectThrow(
    () =>
      service.registerPublication(
        {
          title: "External-only publication",
          type: "Article",
          authors: [
            {
              authorName: "External Author",
              authorOrder: 1,
              affiliationText: "External University",
            },
          ],
        },
        operator,
      ),
    "TC-BR-024",
    "New Publication must link at least one internal Researcher, not merely any author",
  );
  expectThrow(
    () =>
      service.registerPublication(
        {
          title: "Order gap",
          type: "Article",
          authors: [
            {
              researcherId: "RES-101",
              authorName: "Internal Author",
              authorOrder: 2,
              affiliationText: "University A",
            },
          ],
        },
        operator,
      ),
    "TC-BR-048",
    "Author order must start at 1 without gaps",
  );
  expectThrow(
    () =>
      service.registerPublication(
        {
          title: "Non-integer order",
          type: "Article",
          authors: [
            {
              researcherId: "RES-101",
              authorName: "Internal Author",
              authorOrder: 1.5,
              affiliationText: "University A",
            },
          ],
        },
        operator,
      ),
    "TC-BR-048",
    "Author order is an integer",
  );
  expectThrow(
    () =>
      service.registerPublication(
        {
          title: "No affiliation",
          type: "Article",
          authors: [
            {
              researcherId: "RES-101",
              authorName: "Internal Author",
              authorOrder: 1,
            },
          ],
        },
        operator,
      ),
    "TC-BR-048",
    "Every author has affiliationOrgUnitId or affiliationText",
  );

  const created = service.registerPublication(
    {
      title: "Canonical DOI publication",
      type: "Article",
      doi: "10.1000/IHEPSRS.TEST.1",
      authors: [
        {
          researcherId: "RES-101",
          authorName: "Internal Author",
          authorOrder: 1,
          affiliationText: "University A",
        },
        {
          authorName: "External Collaborator",
          authorOrder: 2,
          affiliationText: "External University",
        },
      ],
    },
    operator,
  );
  assert(
    created.publication.status === "SubmittedForValidation",
    "TC-FR-028",
    "Presence of DOI submits identifier for validation instead of auto-marking Validated",
  );
  const validated = service.recordIdentifierValidation(
    created.publication.publicationId,
    true,
    operator,
  );
  assert(
    validated.status === "Validated",
    "TC-BR-025",
    "Canonical Publication becomes Validated only after validation operation",
  );
  expectThrow(
    () => service.archivePublication(validated.publicationId, operator),
    "TC-FR-028",
    "Publication lifecycle rejects Validated -> Archived direct transition",
  );
  service.publishRecord(validated.publicationId, operator);

  const duplicate = service.registerPublication(
    {
      title: "Same DOI alternate metadata",
      type: "Article",
      doi: "10.1000/ihepsrs.test.1",
      authors: [
        {
          authorName: "Additional External Author",
          authorOrder: 1,
          affiliationText: "Another University",
        },
      ],
    },
    operator,
  );
  assert(
    duplicate.isExistingCanonical && duplicate.publication.authors.length === 3,
    "TC-BR-025",
    "Duplicate normalized DOI reuses canonical Publication and appends non-duplicate author metadata",
  );

  const extCanonical = service.registerPublication(
    {
      title: "External identifier canonical",
      type: "Conference",
      externalPublicationId: "EXT-PUB-2026-44",
      authors: [
        {
          researcherId: "RES-102",
          authorName: "Researcher Two",
          authorOrder: 1,
          affiliationText: "University A",
        },
      ],
    },
    operator,
  );
  const extDuplicate = service.registerPublication(
    {
      title: "External identifier duplicate",
      type: "Conference",
      externalPublicationId: "ext-pub-2026-44",
      authors: [
        {
          authorName: "External collaborator",
          authorOrder: 1,
          affiliationText: "External Institute",
        },
      ],
    },
    operator,
  );
  assert(
    extDuplicate.isExistingCanonical &&
      extDuplicate.publication.publicationId ===
        extCanonical.publication.publicationId,
    "TC-BR-025",
    "ExternalPublicationId also resolves to one canonical Publication",
  );

  assert(
    service.getAllPublications(otherInstitution).length === 0,
    "TC-NFR-008-PUB",
    "Publication reads are filtered by institution authorization scope",
  );
  assert(
    audit.verifyChain(),
    "TC-NFR-014",
    "Publication operations commit after validation and produce an intact audit chain",
  );

  console.log(
    "NOTE PUB-004 affiliation-history implementation and PUB-005 external-author linking remain owned by Maram; this correction intentionally does not expose the PUB-005 linking endpoint.",
  );
  console.log("\nCorrective Phase 07 publications verification passed.");
}

main();
