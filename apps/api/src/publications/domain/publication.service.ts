import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  PublicationRecord,
  PublicationAuthorRecord,
  CreatePublicationDto,
  PublicationStatus,
} from "@ihepsrs/contracts";
import { writeStructuredLog } from "../../common/observability/structured-log";

@Injectable()
export class PublicationService {
  private publications = new Map<string, PublicationRecord>();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const pub1: PublicationRecord = {
      publicationId: "PUB-101",
      title:
        "Decentralized Higher Education Record Synchronization using Smart Integration Layer",
      type: "Article",
      doi: "10.1016/j.ihepsrs.2026.04.001",
      publicationDate: "2026-04-15",
      venue: "Journal of Academic Information Systems",
      status: "Validated",
      projectId: "PROJ-101",
      authors: [
        {
          id: "PA-101-1",
          publicationId: "PUB-101",
          researcherId: "RES-101",
          authorName: "سمية خالد الأحمد",
          authorOrder: 1,
          correspondingAuthor: true,
          affiliationText: "King Saud University - CS Department",
        },
      ],
    };
    this.publications.set(pub1.publicationId, pub1);
  }

  // --- FR-028, BR-024, BR-025, BR-048 & UC-12: Publication Registration & DOI Uniqueness ---
  registerPublication(dto: CreatePublicationDto): {
    publication: PublicationRecord;
    isExistingCanonical: boolean;
  } {
    if (!dto.title?.trim()) {
      throw new BadRequestException("Publication title is required");
    }

    // BR-024: Publication must be linked to at least 1 author
    if (!dto.authors || dto.authors.length === 0) {
      throw new BadRequestException(
        "BR-024: Publication must be linked to at least one author",
      );
    }

    // BR-048: Author Ordering & Affiliation Validation
    this.validateAuthorConstraints(dto.authors);

    // BR-025 & UC-12: DOI Uniqueness / Canonical Mapping
    const normalizedDoi = dto.doi?.trim().toLowerCase();
    if (normalizedDoi) {
      const existingCanonical = Array.from(this.publications.values()).find(
        (p) => p.doi?.trim().toLowerCase() === normalizedDoi,
      );

      if (existingCanonical) {
        // DO NOT create a second duplicate publication! Connect new authors/affiliations to existing canonical record.
        const updatedAuthors = [...existingCanonical.authors];
        let maxOrder = Math.max(...updatedAuthors.map((a) => a.authorOrder), 0);

        for (const newAuthor of dto.authors) {
          // Check if author already exists in canonical
          const alreadyLinked = updatedAuthors.some(
            (a) =>
              (newAuthor.researcherId &&
                a.researcherId === newAuthor.researcherId) ||
              a.authorName.toLowerCase() === newAuthor.authorName.toLowerCase(),
          );

          if (!alreadyLinked) {
            maxOrder++;
            updatedAuthors.push({
              id: `PA-${existingCanonical.publicationId}-${Date.now()}-${maxOrder}`,
              publicationId: existingCanonical.publicationId,
              researcherId: newAuthor.researcherId,
              authorName: newAuthor.authorName,
              authorOrder: maxOrder,
              correspondingAuthor: newAuthor.correspondingAuthor || false,
              affiliationOrgUnitId: newAuthor.affiliationOrgUnitId,
              affiliationText: newAuthor.affiliationText,
            });
          }
        }

        const canonicalUpdated: PublicationRecord = {
          ...existingCanonical,
          authors: updatedAuthors,
        };
        this.publications.set(
          existingCanonical.publicationId,
          canonicalUpdated,
        );

        writeStructuredLog({
          level: "info",
          event: "publication.canonical.doi_matched",
          message: `BR-025 / UC-12: Matched existing canonical publication for DOI ${normalizedDoi}. Added non-duplicate authors/affiliations.`,
          publicationId: existingCanonical.publicationId,
          doi: normalizedDoi,
        });

        return { publication: canonicalUpdated, isExistingCanonical: true };
      }
    }

    // Create new Canonical Publication record
    const publicationId = `PUB-${Date.now()}`;
    const authorRecords: PublicationAuthorRecord[] = dto.authors.map(
      (a, index) => ({
        id: `PA-${publicationId}-${index + 1}`,
        publicationId,
        researcherId: a.researcherId,
        authorName: a.authorName,
        authorOrder: a.authorOrder || index + 1,
        correspondingAuthor: a.correspondingAuthor || false,
        affiliationOrgUnitId: a.affiliationOrgUnitId,
        affiliationText: a.affiliationText,
      }),
    );

    const publication: PublicationRecord = {
      publicationId,
      title: dto.title.trim(),
      type: dto.type,
      doi: dto.doi?.trim(),
      publicationDate: dto.publicationDate,
      venue: dto.venue?.trim(),
      status: dto.doi ? "Validated" : "Draft",
      projectId: dto.projectId,
      thesisId: dto.thesisId,
      authors: authorRecords,
    };

    this.publications.set(publicationId, publication);

    writeStructuredLog({
      level: "info",
      event: "publication.registered",
      publicationId,
      title: dto.title,
      doi: dto.doi,
      authorsCount: authorRecords.length,
    });

    return { publication, isExistingCanonical: false };
  }

  // --- BR-048: Author Validation Rules ---
  private validateAuthorConstraints(
    authors: Array<{
      researcherId?: string;
      authorName: string;
      authorOrder: number;
      correspondingAuthor?: boolean;
      affiliationOrgUnitId?: string;
      affiliationText?: string;
    }>,
  ) {
    const orders = new Set<number>();
    for (const a of authors) {
      if (!a.authorName?.trim()) {
        throw new BadRequestException(
          "BR-048: Each author must specify authorName",
        );
      }
      if (!a.authorOrder || a.authorOrder < 1) {
        throw new BadRequestException(
          "BR-048: PublicationAuthor.authorOrder must start from 1",
        );
      }
      if (orders.has(a.authorOrder)) {
        throw new BadRequestException(
          `BR-048: Duplicate authorOrder ${a.authorOrder} within publication`,
        );
      }
      orders.add(a.authorOrder);

      // BR-048: Each author MUST specify either affiliationOrgUnitId or affiliationText
      if (!a.affiliationOrgUnitId?.trim() && !a.affiliationText?.trim()) {
        throw new BadRequestException(
          `BR-048: Author '${a.authorName}' must have affiliationOrgUnitId or affiliationText specified`,
        );
      }
    }
  }

  // --- BR-048: Link External Author to Researcher Profile ---
  linkExternalAuthorToResearcher(dto: {
    publicationId: string;
    authorId: string;
    researcherId: string;
  }): PublicationRecord {
    const publication = this.publications.get(dto.publicationId);
    if (!publication) {
      throw new NotFoundException(`Publication ${dto.publicationId} not found`);
    }

    const authorIndex = publication.authors.findIndex(
      (a) => a.id === dto.authorId,
    );
    if (authorIndex === -1) {
      throw new NotFoundException(
        `Author ${dto.authorId} not found in publication ${dto.publicationId}`,
      );
    }

    const updatedAuthors = [...publication.authors];
    updatedAuthors[authorIndex] = {
      ...updatedAuthors[authorIndex],
      researcherId: dto.researcherId,
      linkedAt: new Date().toISOString(),
    };

    const updatedPub: PublicationRecord = {
      ...publication,
      authors: updatedAuthors,
    };

    this.publications.set(dto.publicationId, updatedPub);

    writeStructuredLog({
      level: "info",
      event: "publication.author.linked",
      publicationId: dto.publicationId,
      authorId: dto.authorId,
      researcherId: dto.researcherId,
    });

    return updatedPub;
  }

  updatePublicationStatus(
    id: string,
    status: PublicationStatus,
  ): PublicationRecord {
    const publication = this.publications.get(id);
    if (!publication) {
      throw new NotFoundException(`Publication ${id} not found`);
    }

    const updated: PublicationRecord = {
      ...publication,
      status,
    };

    this.publications.set(id, updated);
    return updated;
  }

  getPublication(id: string): PublicationRecord {
    const publication = this.publications.get(id);
    if (!publication) {
      throw new NotFoundException(`Publication ${id} not found`);
    }
    return publication;
  }

  getAllPublications(): PublicationRecord[] {
    return Array.from(this.publications.values());
  }
}
