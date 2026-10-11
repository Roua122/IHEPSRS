import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { AcademicAuditService } from "../../postgraduate/domain/academic-audit.service";
import { AcademicAuthorizationService } from "../../postgraduate/domain/academic-authorization.service";
import { AcademicReferenceService } from "../../postgraduate/domain/academic-reference.service";
import type { EnrollmentRecord } from "../../postgraduate/domain/academic.types";
import { EnrollmentLifecycleService } from "../../postgraduate/domain/enrollment-lifecycle.service";
import { ThesisDocumentGateway } from "./thesis-document.gateway";
import {
  THESIS_TRANSITIONS,
  type ThesisRecord,
  type ThesisProgressRecord,
  type ThesisStatus,
  type ThesisStatusAsOf,
  type ThesisTitleAmendment,
  type ThesisVersion,
} from "./thesis.types";

interface ThesisAggregate {
  record: ThesisRecord;
  versions: ThesisVersion[];
  amendments: ThesisTitleAmendment[];
  progress: ThesisProgressRecord[];
}

const PRE_APPROVAL = new Set<ThesisStatus>([
  "Draft", "Registered", "SupervisorAssigned", "ProposalReturned",
]);
const AMENDABLE = new Set<ThesisStatus>([
  "ProposalApproved", "InProgress", "Submitted", "ReturnedForCorrection",
  "DefenseScheduled", "Defended", "CorrectionsRequired", "ReDefenseRequired",
]);

/**
 * TASK-TH-001: entity + immutable versioning foundation for TH002/TH003/TH004.
 * No public arbitrary state update. Review, supervisor, defense, corrections and
 * final approval transitions belong to their owning task implementations.
 *
 * NFR-014 limitation: Map is a prototype repository, NOT a durable transaction.
 * Replace it with a shared transactional repository before final acceptance.
 */
@Injectable()
export class ThesisEntityService {
  private readonly theses = new Map<string, ThesisAggregate>();

  constructor(
    private readonly enrollments: EnrollmentLifecycleService,
    private readonly references: AcademicReferenceService,
    private readonly persons: PersonIdentityService,
    private readonly authorization: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
    private readonly documents: ThesisDocumentGateway,
  ) {}

  /** UC-07 / BR-010: the parent Enrollment must already be Active. */
  createDraft(
    input: { enrollmentId: string; titleAr: string; titleEn?: string; abstract?: string },
    principal: AuthorizationPrincipal,
  ): ThesisRecord {
    const enrollment = this.enrollments.getOne(
      this.required(input?.enrollmentId, "enrollmentId"), principal,
    );
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    const program = this.references.getProgram(enrollment.programId);
    if (program.institutionId !== enrollment.institutionId || !program.orgUnitId) {
      throw this.conflict("BR-002/BR-010: trusted owning academic unit is required");
    }
    const record: ThesisRecord = {
      thesisId: randomUUID(),
      enrollmentId: enrollment.enrollmentId,
      orgUnitId: program.orgUnitId,
      titleAr: this.title(input?.titleAr, "titleAr"),
      titleEn: this.optionalTitle(input?.titleEn, "titleEn"),
      abstract: this.optionalText(input?.abstract, "abstract"),
      status: "Draft",
      reDefenseCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.audit.transition({
      entityType: "Thesis", entityId: record.thesisId, toStatus: "Draft",
      actorUserId: principal.userId, sourceId: "FR-016/FR-045", reasonCode: "DraftCreated",
    });
    this.theses.set(record.thesisId, { record, versions: [], amendments: [], progress: [] });
    return { ...record };
  }

  /** Only the Draft -> Registered operation is owned by TH001. */
  register(thesisId: string, principal: AuthorizationPrincipal): ThesisRecord {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(current.record.enrollmentId, principal);
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    this.assertTransition(current.record.status, "Registered");
    const next: ThesisRecord = { ...current.record, status: "Registered" };
    this.audit.transition({
      entityType: "Thesis", entityId: thesisId,
      fromStatus: current.record.status, toStatus: next.status,
      actorUserId: principal.userId, sourceId: "FR-016/BR-010/FR-045",
      reasonCode: "ThesisRegistered",
    });
    this.theses.set(thesisId, { ...current, record: next });
    return { ...next };
  }

  /**
   * BR-036/045: revisions append a distinct Proposal version. Content can be
   * drafted here; TH003 owns submission, supervisor review and approval.
   * Approved title/abstract cannot be rewritten through this endpoint.
   */
  async addProposalVersion(
    thesisId: string,
    input: { titleAr: string; titleEn?: string; abstract?: string; documentLinkId?: string },
    principal: AuthorizationPrincipal,
  ): Promise<ThesisVersion> {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(current.record.enrollmentId, principal);
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (!PRE_APPROVAL.has(current.record.status)) {
      throw this.conflict("BR-014/045: post-approval content requires an AmendmentRequest");
    }
    const titleAr = this.title(input?.titleAr, "titleAr");
    const titleEn = this.optionalTitle(input?.titleEn, "titleEn");
    const abstract = this.optionalText(input?.abstract, "abstract");
    const linkId = this.optionalText(input?.documentLinkId, "documentLinkId");
    let documentId: string | undefined;
    if (linkId) {
      const verified = await this.documents.resolveAvailableLink(thesisId, linkId);
      if (verified.available !== true || verified.targetType !== "Thesis" ||
        verified.targetId !== thesisId || verified.documentLinkId !== linkId ||
        !verified.documentId?.trim() || !verified.purpose?.trim()) {
        throw this.conflict("FR-029/BR-057: document link must be available and bound to this Thesis");
      }
      documentId = verified.documentId;
    }
    const version: ThesisVersion = {
      thesisVersionId: randomUUID(), thesisId,
      versionNo: current.versions.length + 1,
      versionType: "Proposal", title: titleAr, titleEn, abstract,
      documentId, documentLinkId: linkId,
      createdAt: new Date().toISOString(), createdByUserId: principal.userId,
    };
    const next: ThesisRecord = {
      ...current.record, titleAr, titleEn, abstract,
      currentVersionId: version.thesisVersionId,
    };
    this.audit.record(
      principal.userId, "thesis.version.proposal.added", "Thesis", thesisId,
      "FR-015/BR-036/BR-045",
    );
    this.theses.set(thesisId, {
      ...current, record: next, versions: [...current.versions, version],
    });
    return { ...version };
  }

  /** BR-014/045: no direct edits to an already approved thesis title. */
  requestTitleAmendment(
    thesisId: string,
    input: { titleAr: string; titleEn?: string; reason: string },
    principal: AuthorizationPrincipal,
  ): ThesisTitleAmendment {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(current.record.enrollmentId, principal);
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    this.assertAmendable(current);
    const titleAr = this.title(input?.titleAr, "titleAr");
    const titleEn = this.optionalTitle(input?.titleEn, "titleEn");
    const reason = this.required(input?.reason, "reason");
    if (titleAr === current.record.titleAr && titleEn === current.record.titleEn) {
      throw this.invalid("BR-014: amendment must change a title field");
    }
    if (current.amendments.some((request) => request.status === "Submitted")) {
      throw this.conflict("BR-014: prior title AmendmentRequest requires a decision");
    }
    const request: ThesisTitleAmendment = {
      amendmentId: randomUUID(), thesisId, changeType: "Title",
      baseVersionId: current.record.currentVersionId!,
      proposedTitleAr: titleAr, proposedTitleEn: titleEn, reason,
      requestedByUserId: principal.userId, requestedAt: new Date().toISOString(),
      status: "Submitted",
    };
    this.audit.record(principal.userId, "thesis.title.amendment.requested", "Thesis", thesisId, "BR-014/045");
    this.theses.set(thesisId, { ...current, amendments: [...current.amendments, request] });
    return { ...request };
  }

  /** The decision and the new content version are committed as one projection. */
  decideTitleAmendment(
    thesisId: string,
    amendmentId: string,
    input: { approve: boolean; reason: string },
    principal: AuthorizationPrincipal,
  ): { amendment: ThesisTitleAmendment; version?: ThesisVersion } {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(current.record.enrollmentId, principal);
    this.authorization.assertAuthority(principal, enrollment.institutionId, enrollment.programId);
    this.assertAmendable(current);
    const reason = this.required(input?.reason, "decision reason");
    if (typeof input?.approve !== "boolean") throw this.invalid("BR-014: approve must be boolean");
    const request = current.amendments.find((item) => item.amendmentId === amendmentId);
    if (!request) throw this.notFound("BR-014: title amendment not found");
    if (request.status !== "Submitted") throw this.conflict("BR-014: title amendment already decided");
    const decidedAt = new Date().toISOString();
    let version: ThesisVersion | undefined;
    let nextRecord = current.record;
    if (input.approve) {
      this.assertActiveEnrollment(enrollment);
      if (request.baseVersionId !== current.record.currentVersionId) {
        throw this.conflict("BR-014/045: thesis version changed; rebase amendment before approval");
      }
      const base = current.versions.find((item) => item.thesisVersionId === request.baseVersionId);
      if (!base) throw this.conflict("BR-045: base ThesisVersion is missing");
      version = {
        thesisVersionId: randomUUID(), thesisId, versionNo: current.versions.length + 1,
        versionType: "Amendment", title: request.proposedTitleAr,
        titleEn: request.proposedTitleEn, abstract: base.abstract,
        createdAt: decidedAt, submittedAt: request.requestedAt, approvedAt: decidedAt,
        createdByUserId: request.requestedByUserId,
      };
      nextRecord = {
        ...current.record, titleAr: request.proposedTitleAr,
        titleEn: request.proposedTitleEn, currentVersionId: version.thesisVersionId,
      };
    }
    const decision: ThesisTitleAmendment = {
      ...request, status: input.approve ? "Applied" : "Rejected",
      decisionReason: reason, decidedAt, decidedByUserId: principal.userId,
      appliedVersionId: version?.thesisVersionId,
    };
    this.audit.record(principal.userId, input.approve
      ? "thesis.title.amendment.applied" : "thesis.title.amendment.rejected",
    "Thesis", thesisId, "BR-014/BR-045");
    this.theses.set(thesisId, {
      ...current, record: nextRecord,
      versions: version ? [...current.versions, version] : current.versions,
      amendments: current.amendments.map((item) =>
        item.amendmentId === amendmentId ? decision : item),
    });
    return { amendment: { ...decision }, version: version ? { ...version } : undefined };
  }

  /** UC-22 / FR-045: never edit a past progress report in place. */
  appendStudentProgress(
    thesisId: string,
    input: { periodFrom: string; periodTo: string; studentSummary: string },
    principal: AuthorizationPrincipal,
  ): ThesisProgressRecord {
    const current = this.scoped(thesisId, principal);
    const enrollment = this.enrollments.getOne(current.record.enrollmentId, principal);
    this.assertWriter(principal, enrollment);
    this.assertActiveEnrollment(enrollment);
    if (current.record.status !== "InProgress") {
      throw this.conflict("UC-22: progress report requires InProgress Thesis");
    }
    const from = this.strictDate(input?.periodFrom, "periodFrom");
    const to = this.strictDate(input?.periodTo, "periodTo");
    if (from > to) throw this.invalid("UC-22: periodFrom must not exceed periodTo");
    const report: ThesisProgressRecord = {
      progressId: randomUUID(), thesisId, periodFrom: from, periodTo: to,
      studentSummary: this.required(input?.studentSummary, "studentSummary"),
      createdByUserId: principal.userId, createdAt: new Date().toISOString(),
    };
    this.audit.record(principal.userId, "thesis.progress.student.added", "Thesis", thesisId, "FR-045/UC-22");
    this.theses.set(thesisId, { ...current, progress: [...current.progress, report] });
    return { ...report };
  }

  progressReports(thesisId: string, principal: AuthorizationPrincipal): ThesisProgressRecord[] {
    return this.scoped(thesisId, principal).progress.map((entry) => ({ ...entry }));
  }

  getOne(thesisId: string, principal: AuthorizationPrincipal): ThesisRecord {
    return { ...this.scoped(thesisId, principal).record };
  }

  listByEnrollment(enrollmentId: string, principal: AuthorizationPrincipal): ThesisRecord[] {
    const enrollment = this.enrollments.getOne(this.required(enrollmentId, "enrollmentId"), principal);
    return [...this.theses.values()].filter((item) => item.record.enrollmentId === enrollment.enrollmentId)
      .map((item) => ({ ...item.record }));
  }

  versions(thesisId: string, principal: AuthorizationPrincipal): ThesisVersion[] {
    return this.scoped(thesisId, principal).versions.map((item) => ({ ...item }));
  }

  titleAmendments(thesisId: string, principal: AuthorizationPrincipal): ThesisTitleAmendment[] {
    return this.scoped(thesisId, principal).amendments.map((item) => ({ ...item }));
  }

  /** FR-045: a consistent status and version-count read at one UTC instant. */
  statusAsOf(thesisId: string, at: string, principal: AuthorizationPrincipal): ThesisStatusAsOf {
    const current = this.scoped(thesisId, principal);
    const asOf = this.utcTimestamp(at);
    const history = this.audit.history("Thesis", thesisId).filter((item) => item.changedAt <= asOf);
    if (!history.length) throw this.notFound("FR-045: Thesis did not exist as of requested time");
    const last = history.at(-1)!;
    return {
      thesisId, asOf, datasetVersion: `${thesisId}:${history.length}:${last.statusHistoryId}`,
      status: last.toStatus as ThesisStatus,
      versionCount: current.versions.filter((item) => item.createdAt <= asOf).length,
    };
  }

  /** Reusable by TH002/TH003/TH004, but not an arbitrary public status API. */
  assertTransition(from: ThesisStatus, to: ThesisStatus): void {
    if (!THESIS_TRANSITIONS[from].includes(to)) {
      throw this.conflict(`FR-016: forbidden Thesis transition ${from} -> ${to}`);
    }
  }

  private scoped(thesisId: string, principal: AuthorizationPrincipal): ThesisAggregate {
    const current = this.theses.get(this.required(thesisId, "thesisId"));
    if (!current) throw this.notFound("FR-016: Thesis not found");
    // Delegates institution and person scope to the parent Enrollment owner.
    this.enrollments.getOne(current.record.enrollmentId, principal);
    return current;
  }

  private assertWriter(principal: AuthorizationPrincipal, enrollment: EnrollmentRecord): void {
    if (principal?.authenticated && principal.personId &&
      this.persons.resolveCanonicalPersonId(principal.personId) ===
        this.persons.resolveCanonicalPersonId(enrollment.personId)) return;
    this.authorization.assertOfficer(principal, enrollment.institutionId, enrollment.programId);
  }

  private assertActiveEnrollment(enrollment: EnrollmentRecord): void {
    if (enrollment.status !== "Active") {
      throw this.conflict("BR-010: an active postgraduate Enrollment is required");
    }
  }

  private assertAmendable(current: ThesisAggregate): void {
    if (!AMENDABLE.has(current.record.status) || !current.record.currentVersionId) {
      throw this.conflict("BR-014/045: approved proposal and existing content version required");
    }
  }

  private title(value: unknown, field: string): string {
    const text = this.required(value, field);
    if (text.length > 1000) throw this.invalid(`FR-015: ${field} exceeds 1000 characters`);
    return text;
  }

  private optionalTitle(value: unknown, field: string): string | undefined {
    return value === undefined ? undefined : this.title(value, field);
  }

  private optionalText(value: unknown, field: string): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string") throw this.invalid(`FR-015: ${field} must be a string`);
    return value.trim() || undefined;
  }

  private required(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw this.invalid(`FR-015/016: ${field} is required`);
    }
    return value.trim();
  }

  private strictDate(value: unknown, field: string): string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) ||
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) {
      throw this.invalid(`FR-045: ${field} must be YYYY-MM-DD`);
    }
    return value;
  }

  private utcTimestamp(value: string): string {
    if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
      throw this.invalid("FR-045: at must be a valid ISO-8601 UTC timestamp");
    }
    return value;
  }
  private invalid(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }
  private conflict(message: string): AppException {
    return new AppException({ code: ErrorCode.Conflict, status: HttpStatus.CONFLICT, message });
  }
  private notFound(message: string): AppException {
    return new AppException({ code: ErrorCode.NotFound, status: HttpStatus.NOT_FOUND, message });
  }
}
