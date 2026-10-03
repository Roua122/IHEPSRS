const {
  PublicationService,
} = require("../dist/publications/domain/publication.service.js");

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
    "=== Checking Phase 07 Publications Tasks (TASK-PUB-001, TASK-PUB-002, TASK-PUB-003) ===",
  );

  const service = new PublicationService();

  // -------------------------------------------------------------
  // 1. TASK-PUB-001 & TASK-PUB-003: Publication Registry & Author Ordering (FR-028, BR-024, BR-048)
  // -------------------------------------------------------------

  // BR-024: Link at least 1 author
  expectThrow(
    () =>
      service.registerPublication({
        title: "Test Publication without Authors",
        type: "Article",
        authors: [],
      }),
    "TC-BR-024",
    "BR-024: Publication registration fails if no authors are linked",
  );

  // BR-048: Author order must start from 1 and be unique
  expectThrow(
    () =>
      service.registerPublication({
        title: "Test Publication with Invalid Author Order",
        type: "Article",
        authors: [
          {
            authorName: "Author One",
            authorOrder: 1,
            affiliationText: "Univ A",
          },
          {
            authorName: "Author Two",
            authorOrder: 1, // Duplicate order
            affiliationText: "Univ B",
          },
        ],
      }),
    "TC-BR-048",
    "BR-048: Publication registration fails if duplicate authorOrder specified",
  );

  // BR-048: Author must specify affiliation
  expectThrow(
    () =>
      service.registerPublication({
        title: "Test Publication missing Affiliation",
        type: "Article",
        authors: [
          {
            authorName: "Author One",
            authorOrder: 1,
            // Missing affiliationText and affiliationOrgUnitId
          },
        ],
      }),
    "TC-BR-048",
    "BR-048: Publication registration fails if author missing affiliation",
  );

  // Register valid publication
  const res1 = service.registerPublication({
    title:
      "Quantum-Resistant Identity Verification Protocols in Higher Education",
    type: "Article",
    doi: "10.1016/j.ihepsrs.2026.09.999",
    publicationDate: "2026-09-01",
    venue: "IEEE Transactions on Information Security",
    authors: [
      {
        researcherId: "RES-101",
        authorName: "سمية خالد الأحمد",
        authorOrder: 1,
        correspondingAuthor: true,
        affiliationText: "King Saud University",
      },
      {
        authorName: "External Collaborator",
        authorOrder: 2,
        correspondingAuthor: false,
        affiliationText: "MIT CSAIL",
      },
    ],
  });

  assert(
    !res1.isExistingCanonical && res1.publication.authors.length === 2,
    "TC-FR-028",
    "FR-028: Valid publication registered with 2 authors and canonical status",
  );

  assert(
    res1.publication.authors[0].authorOrder === 1 &&
      res1.publication.authors[1].authorOrder === 2,
    "TC-BR-048",
    "BR-048: Publication author ordering is preserved sequentially starting from 1",
  );

  // -------------------------------------------------------------
  // 2. TASK-PUB-002 & UC-12: DOI Uniqueness & Canonical Mapping (BR-025, UC-12)
  // -------------------------------------------------------------

  // Attempting to register the exact same DOI again (BR-025 / UC-12)
  const res2 = service.registerPublication({
    title: "Duplicate Title with Same DOI",
    type: "Article",
    doi: "10.1016/j.ihepsrs.2026.09.999", // Same DOI
    authors: [
      {
        authorName: "Third Author Added Later",
        authorOrder: 1,
        affiliationText: "Stanford University",
      },
    ],
  });

  assert(
    res2.isExistingCanonical === true,
    "TC-BR-025",
    "BR-025 / UC-12: Registering publication with existing DOI returns canonical publication record",
  );

  assert(
    res2.publication.authors.length === 3,
    "TC-UC-12",
    "UC-12: Duplicate DOI submission connects new author/affiliation to canonical record without creating duplicate publication entity",
  );

  // Link external author to researcher (BR-048)
  const externalAuthorId = res1.publication.authors[1].id;
  const linkedPub = service.linkExternalAuthorToResearcher({
    publicationId: res1.publication.publicationId,
    authorId: externalAuthorId,
    researcherId: "RES-102",
  });

  assert(
    linkedPub.authors[1].researcherId === "RES-102" &&
      linkedPub.authors[1].linkedAt !== undefined,
    "TC-BR-048",
    "BR-048: External author linked to Researcher profile without modifying author order",
  );

  console.log("\nPhase 07 Publications tasks verification check passed.");
}

main();
