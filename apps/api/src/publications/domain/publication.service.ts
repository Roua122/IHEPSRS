import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  CreatePublicationDto,
  PublicationAuthorRecord,
  PublicationRecord,
} from "@ihepsrs/contracts";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { ResearchAuditService } from "../../research/domain/research-audit.service";
import { ResearchAuthorizationService } from "../../research/domain/research-authorization.service";

function normalizeIdentifier(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
}

@Injectable()
export class PublicationService {
  private readonly publications = new Map<string, PublicationRecord>();

  constructor(
    private readonly identity: PersonIdentityService,
    private readonly authorization: ResearchAuthorizationService,
    private readonly audit: ResearchAuditService,
  ) {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const publication: PublicationRecord = {
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
    this.publications.set(publication.publicationId, publication);
  }

  registerPublication(
    dto: CreatePublicationDto,
    principal: AuthorizationPrincipal,
  ): { publication: PublicationRecord; isExistingCanonical: boolean } {
    if (!dto.title?.trim()) {
      throw this.validation("Publication title is required");
    }
    if (!Array.isArray(dto.authors) || dto.authors.length === 0) {
      throw this.validation("BR-024: Publication must contain authors");
    }
    this.validateAuthorConstraints(dto.authors, dto.publicationDate);

    const doi = normalizeIdentifier(dto.doi);
    const externalPublicationId = normalizeIdentifier(
      dto.externalPublicationId,
    );
    const canonical = this.findCanonical(doi, externalPublicationId);

    if (canonical) {
      this.assertCanAccessPublication(principal, canonical);
      const mergedAuthors = this.mergeCanonicalAuthors(
        canonical.publicationId,
        canonical.authors,
        dto.authors,
      );
      this.assertHasInternalResearcher(mergedAuthors);
      const updated: PublicationRecord = {
        ...canonical,
        authors: mergedAuthors,
      };
      this.publications.set(canonical.publicationId, updated);
      this.audit.append({
        actorUserId: principal.userId,
        action: "publication.canonical.identifier_matched",
        entityType: "Publication",
        entityId: canonical.publicationId,
        metadata: { sourceId: "BR-025" },
      });
      return {
        publication: this.clonePublication(updated),
        isExistingCanonical: true,
      };
    }

    const internalResearcherIds = dto.authors
      .map((author) => author.researcherId)
      .filter((value): value is string => Boolean(value));
    if (internalResearcherIds.length === 0) {
      throw this.validation(
        "BR-024: A new Publication must be linked to at least one Researcher",
      );
    }
    const researchers = internalResearcherIds.map((id) =>
      this.identity.getResearcher(id),
    );
    this.authorization.assertAnyResearchInstitution(
      principal,
      researchers.map((researcher) => researcher.institutionId),
    );

    const publicationId = randomUUID();
    const authorRecords: PublicationAuthorRecord[] = dto.authors.map(
      (author) => ({
        id: randomUUID(),
        publicationId,
        researcherId: author.researcherId,
        authorName: author.authorName.trim(),
        authorOrder: author.authorOrder,
        correspondingAuthor: author.correspondingAuthor ?? false,
        affiliationOrgUnitId: author.affiliationOrgUnitId?.trim() || undefined,
        affiliationText: author.affiliationText?.trim() || undefined,
      }),
    );

    const publication: PublicationRecord = {
      publicationId,
      title: dto.title.trim(),
      type: dto.type,
      doi,
      externalPublicationId,
      publicationDate: dto.publicationDate,
      venue: dto.venue?.trim() || undefined,
      status: doi || externalPublicationId ? "SubmittedForValidation" : "Draft",
      projectId: dto.projectId,
      thesisId: dto.thesisId,
      authors: authorRecords,
    };
    this.publications.set(publicationId, publication);
    this.audit.append({
      actorUserId: principal.userId,
      action: "publication.registered",
      entityType: "Publication",
      entityId: publicationId,
      metadata: { sourceId: "FR-028", status: publication.status },
    });
    return {
      publication: this.clonePublication(publication),
      isExistingCanonical: false,
    };
  }

  submitForValidation(
    publicationId: string,
    principal: AuthorizationPrincipal,
  ): PublicationRecord {
    const publication = this.requirePublication(publicationId);
    this.assertCanAccessPublication(principal, publication);
    if (publication.status !== "Draft") {
      throw this.validation(
        "Only Draft Publication can be submitted for validation",
      );
    }
    if (!publication.doi && !publication.externalPublicationId) {
      throw this.validation(
        "Identifier validation requires DOI or ExternalPublicationId",
      );
    }
    const updated = {
      ...publication,
      status: "SubmittedForValidation" as const,
    };
    this.publications.set(publicationId, updated);
    return this.auditStatus(principal, updated, "SubmittedForValidation");
  }

  recordIdentifierValidation(
    publicationId: string,
    valid: boolean,
    principal: AuthorizationPrincipal,
    reason?: string,
  ): PublicationRecord {
    const publication = this.requirePublication(publicationId);
    this.assertCanAccessPublication(principal, publication);
    if (publication.status !== "SubmittedForValidation") {
      throw this.validation(
        "Identifier validation requires SubmittedForValidation status",
      );
    }
    if (!valid && !reason?.trim()) {
      throw this.validation("Validation rejection reason is required");
    }
    const updated: PublicationRecord = {
      ...publication,
      status: valid ? "Validated" : "Draft",
    };
    this.publications.set(publicationId, updated);
    this.audit.append({
      actorUserId: principal.userId,
      action: "publication.identifier_validation_recorded",
      entityType: "Publication",
      entityId: publicationId,
      metadata: {
        sourceId: "BR-025/UC-12",
        valid,
        reason: reason?.trim() || null,
      },
    });
    return this.clonePublication(updated);
  }

  publishRecord(
    publicationId: string,
    principal: AuthorizationPrincipal,
  ): PublicationRecord {
    const publication = this.requirePublication(publicationId);
    this.assertCanAccessPublication(principal, publication);
    if (publication.status !== "Validated") {
      throw this.validation(
        "Publication must be Validated before PublishedRecord",
      );
    }
    const updated = { ...publication, status: "PublishedRecord" as const };
    this.publications.set(publicationId, updated);
    return this.auditStatus(principal, updated, "PublishedRecord");
  }

  archivePublication(
    publicationId: string,
    principal: AuthorizationPrincipal,
  ): PublicationRecord {
    const publication = this.requirePublication(publicationId);
    this.assertCanAccessPublication(principal, publication);
    if (publication.status !== "PublishedRecord") {
      throw this.validation("Only PublishedRecord Publication can be archived");
    }
    const updated = { ...publication, status: "Archived" as const };
    this.publications.set(publicationId, updated);
    return this.auditStatus(principal, updated, "Archived");
  }

  linkExternalAuthorToResearcher(
    publicationId: string,
    authorId: string,
    researcherId: string,
    principal: AuthorizationPrincipal,
  ): PublicationRecord {
    const snapshot = structuredClone(this.publications);
    const auditLength = this.audit.snapshotLength();
    try {
      const publication = this.requirePublication(publicationId);
      this.assertCanAccessPublication(principal, publication);
      const authorIndex = publication.authors.findIndex(
        (author) => author.id === authorId,
      );
      if (authorIndex < 0) {
        throw new AppException({
          code: ErrorCode.NotFound,
          status: HttpStatus.NOT_FOUND,
          message: `PublicationAuthor ${authorId} not found`,
        });
      }
      const author = publication.authors[authorIndex];
      if (author.researcherId) {
        if (author.researcherId === researcherId) {
          return this.clonePublication(publication);
        }
        throw new AppException({
          code: ErrorCode.Conflict,
          status: HttpStatus.CONFLICT,
          message:
            "BR-048/BR-055: Already-linked PublicationAuthor cannot be silently relinked to another Researcher",
        });
      }

      const researcher = this.identity.getResearcher(researcherId);
      this.authorization.assertResearchOperation(
        principal,
        researcher.institutionId,
      );
      const authors = publication.authors.map((current, index) =>
        index === authorIndex
          ? {
              ...current,
              researcherId,
              linkedAt: new Date().toISOString(),
            }
          : { ...current },
      );
      const updated: PublicationRecord = { ...publication, authors };
      this.publications.set(publicationId, updated);
      this.audit.append({
        actorUserId: principal.userId,
        action: "publication.external_author.linked",
        entityType: "PublicationAuthor",
        entityId: authorId,
        metadata: {
          sourceId: "PUB-005/FR-042/BR-048/BR-055",
          publicationId,
          researcherId,
        },
      });
      return this.clonePublication(updated);
    } catch (error) {
      this.publications.clear();
      for (const [key, value] of snapshot.entries()) {
        this.publications.set(key, value);
      }
      this.audit.rollbackTo(auditLength);
      throw error;
    }
  }

  getPublication(
    publicationId: string,
    principal: AuthorizationPrincipal,
  ): PublicationRecord {
    const publication = this.requirePublication(publicationId);
    this.assertCanAccessPublication(principal, publication);
    return this.clonePublication(publication);
  }

  getAllPublications(principal: AuthorizationPrincipal): PublicationRecord[] {
    return Array.from(this.publications.values())
      .filter((publication) =>
        this.canAccessPublication(principal, publication),
      )
      .map((publication) => this.clonePublication(publication));
  }

  private findCanonical(
    doi: string | undefined,
    externalPublicationId: string | undefined,
  ): PublicationRecord | undefined {
    const doiMatch = doi
      ? Array.from(this.publications.values()).find(
          (publication) => normalizeIdentifier(publication.doi) === doi,
        )
      : undefined;
    const externalMatch = externalPublicationId
      ? Array.from(this.publications.values()).find(
          (publication) =>
            normalizeIdentifier(publication.externalPublicationId) ===
            externalPublicationId,
        )
      : undefined;

    if (
      doiMatch &&
      externalMatch &&
      doiMatch.publicationId !== externalMatch.publicationId
    ) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message:
          "BR-025: DOI and ExternalPublicationId resolve to different canonical publications",
      });
    }
    return doiMatch ?? externalMatch;
  }

  private validateAuthorConstraints(
    authors: CreatePublicationDto["authors"],
    publicationDate?: string,
  ): void {
    const orders = authors.map((author) => author.authorOrder);
    if (orders.some((order) => !Number.isInteger(order) || order < 1)) {
      throw this.validation(
        "BR-048: PublicationAuthor.authorOrder must be a positive integer",
      );
    }
    const unique = new Set(orders);
    if (unique.size !== orders.length) {
      throw this.validation(
        "BR-048: authorOrder must be unique within Publication",
      );
    }
    const sorted = [...unique].sort((a, b) => a - b);
    if (sorted.some((order, index) => order !== index + 1)) {
      throw this.validation(
        "BR-048: authorOrder must form a sequence starting from 1",
      );
    }

    for (const author of authors) {
      if (!author.authorName?.trim()) {
        throw this.validation("BR-048: authorName is required");
      }
      if (
        !author.affiliationOrgUnitId?.trim() &&
        !author.affiliationText?.trim()
      ) {
        throw this.validation(
          `BR-048: Author '${author.authorName}' requires affiliationOrgUnitId or affiliationText`,
        );
      }
      if (author.researcherId) {
        this.identity.getResearcher(author.researcherId);
        if (
          publicationDate &&
          author.affiliationOrgUnitId &&
          !this.identity.hasAffiliationAt(
            author.researcherId,
            author.affiliationOrgUnitId,
            publicationDate,
          )
        ) {
          throw this.validation(
            "BR-048/FR-021: affiliationOrgUnitId must match the Researcher affiliation effective at publication time",
          );
        }
      }
    }
  }

  private mergeCanonicalAuthors(
    publicationId: string,
    existing: readonly PublicationAuthorRecord[],
    incoming: CreatePublicationDto["authors"],
  ): PublicationAuthorRecord[] {
    const merged = existing.map((author) => ({ ...author }));
    let nextOrder =
      Math.max(...merged.map((author) => author.authorOrder), 0) + 1;
    for (const author of incoming) {
      if (author.researcherId) this.identity.getResearcher(author.researcherId);
      const duplicate = merged.some((current) => {
        if (
          author.researcherId &&
          current.researcherId === author.researcherId
        ) {
          return true;
        }
        return (
          current.authorName.trim().toLowerCase() ===
            author.authorName.trim().toLowerCase() &&
          (current.affiliationText ?? "").trim().toLowerCase() ===
            (author.affiliationText ?? "").trim().toLowerCase() &&
          (current.affiliationOrgUnitId ?? "") ===
            (author.affiliationOrgUnitId ?? "")
        );
      });
      if (duplicate) continue;
      merged.push({
        id: randomUUID(),
        publicationId,
        researcherId: author.researcherId,
        authorName: author.authorName.trim(),
        authorOrder: nextOrder++,
        correspondingAuthor: author.correspondingAuthor ?? false,
        affiliationOrgUnitId: author.affiliationOrgUnitId?.trim() || undefined,
        affiliationText: author.affiliationText?.trim() || undefined,
      });
    }
    return merged;
  }

  private assertHasInternalResearcher(
    authors: readonly PublicationAuthorRecord[],
  ): void {
    if (!authors.some((author) => Boolean(author.researcherId))) {
      throw this.validation(
        "BR-024: Publication must remain linked to at least one Researcher",
      );
    }
  }

  private canAccessPublication(
    principal: AuthorizationPrincipal,
    publication: PublicationRecord,
  ): boolean {
    const researchers = publication.authors
      .filter((author) => Boolean(author.researcherId))
      .map((author) => this.identity.getResearcher(author.researcherId!));
    return researchers.some((researcher) =>
      this.authorization.canManageInstitution(
        principal,
        researcher.institutionId,
      ),
    );
  }

  private assertCanAccessPublication(
    principal: AuthorizationPrincipal,
    publication: PublicationRecord,
  ): void {
    if (this.canAccessPublication(principal, publication)) return;
    const institutions = publication.authors
      .filter((author) => Boolean(author.researcherId))
      .map(
        (author) =>
          this.identity.getResearcher(author.researcherId!).institutionId,
      );
    this.authorization.assertAnyResearchInstitution(principal, institutions);
  }

  private auditStatus(
    principal: AuthorizationPrincipal,
    publication: PublicationRecord,
    status: string,
  ): PublicationRecord {
    this.audit.append({
      actorUserId: principal.userId,
      action: "publication.status_changed",
      entityType: "Publication",
      entityId: publication.publicationId,
      metadata: { sourceId: "FR-028", status },
    });
    return this.clonePublication(publication);
  }

  private requirePublication(publicationId: string): PublicationRecord {
    const publication = this.publications.get(publicationId);
    if (!publication) {
      throw new AppException({
        code: ErrorCode.NotFound,
        status: HttpStatus.NOT_FOUND,
        message: `Publication ${publicationId} not found`,
      });
    }
    return publication;
  }

  private clonePublication(publication: PublicationRecord): PublicationRecord {
    return {
      ...publication,
      authors: publication.authors.map((author) => ({ ...author })),
    };
  }

  private validation(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }
}
