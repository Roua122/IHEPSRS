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
  console.log("=== Verification: Phase 07 Publications 001-005 ===");
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

  // PUB-004 / FR-021 / BR-048 — affiliation snapshot at publication time
  const affiliationPublication = service.registerPublication(
    {
      title: "Affiliation snapshot publication",
      type: "Article",
      publicationDate: "2026-05-01",
      authors: [
        {
          researcherId: "RES-101",
          authorName: "Internal Author",
          authorOrder: 1,
          affiliationOrgUnitId: "OU-CS",
        },
      ],
    },
    operator,
  );
  assert(
    affiliationPublication.publication.authors[0].affiliationOrgUnitId ===
      "OU-CS",
    "TC-FR-021/PUB-004",
    "PublicationAuthor preserves the affiliation effective at publication time",
  );
  expectThrow(
    () =>
      service.registerPublication(
        {
          title: "Wrong historical affiliation",
          type: "Article",
          publicationDate: "2026-05-01",
          authors: [
            {
              researcherId: "RES-101",
              authorName: "Internal Author",
              authorOrder: 1,
              affiliationOrgUnitId: "OU-NOT-EFFECTIVE",
            },
          ],
        },
        operator,
      ),
    "TC-BR-048/PUB-004",
    "Internal affiliationOrgUnitId must be effective for the Researcher at publication date",
  );
  identity.addResearcherAffiliation("RES-101", {
    affiliationId: "AFF-RES101-FUTURE",
    institutionId: "INST-001",
    orgUnitId: "OU-FUTURE",
    roleRank: "Professor",
    effectiveFrom: "2027-01-01",
    sourceSystem: "IHEPSRS_TEST",
  });
  assert(
    service.getPublication(
      affiliationPublication.publication.publicationId,
      operator,
    ).authors[0].affiliationOrgUnitId === "OU-CS",
    "TC-BR-048/PUB-004",
    "Later Researcher affiliation changes do not rewrite the PublicationAuthor snapshot",
  );

  // PUB-005 / FR-042 / BR-048 / BR-055 — link external author later
  const externalAuthor = created.publication.authors.find(
    (author) => !author.researcherId,
  );
  const publicationCountBeforeLink =
    service.getAllPublications(operator).length;
  const linked = service.linkExternalAuthorToResearcher(
    created.publication.publicationId,
    externalAuthor.id,
    "RES-102",
    operator,
  );
  const linkedAuthor = linked.authors.find(
    (author) => author.id === externalAuthor.id,
  );
  assert(
    linked.publicationId === created.publication.publicationId &&
      linkedAuthor.researcherId === "RES-102" &&
      linkedAuthor.authorOrder === externalAuthor.authorOrder &&
      linkedAuthor.affiliationText === externalAuthor.affiliationText &&
      Boolean(linkedAuthor.linkedAt) &&
      service.getAllPublications(operator).length ===
        publicationCountBeforeLink,
    "TC-BR-048/PUB-005",
    "External author links to an existing Researcher without creating a new Publication or changing author order/affiliation snapshot",
  );
  expectThrow(
    () =>
      service.linkExternalAuthorToResearcher(
        created.publication.publicationId,
        externalAuthor.id,
        "RES-101",
        operator,
      ),
    "TC-BR-055/PUB-005",
    "Already-linked PublicationAuthor is not silently relinked to another Person/Researcher identity",
  );

  const atomicPublication = service.registerPublication(
    {
      title: "Atomic external-link test",
      type: "Conference",
      authors: [
        {
          researcherId: "RES-101",
          authorName: "Internal Author",
          authorOrder: 1,
          affiliationText: "University A",
        },
        {
          authorName: "External Atomic Author",
          authorOrder: 2,
          affiliationText: "External Institute",
        },
      ],
    },
    operator,
  ).publication;
  const atomicAuthor = atomicPublication.authors[1];
  const originalAuditAppend = audit.append.bind(audit);
  audit.append = () => {
    throw new Error("simulated audit failure");
  };
  expectThrow(
    () =>
      service.linkExternalAuthorToResearcher(
        atomicPublication.publicationId,
        atomicAuthor.id,
        "RES-102",
        operator,
      ),
    "TC-NFR-014/PUB-005",
    "External-author link rolls back when audit persistence fails",
  );
  audit.append = originalAuditAppend;
  assert(
    !service
      .getPublication(atomicPublication.publicationId, operator)
      .authors.find((author) => author.id === atomicAuthor.id).researcherId,
    "TC-NFR-014/PUB-005",
    "Failed external-author link leaves no partial PublicationAuthor update",
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

  console.log("\nPhase 07 Publications 001-005 verification passed.");
}

main();
