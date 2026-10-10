import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { AcademicAuditService } from "./academic-audit.service";
import { AcademicAuthorizationService } from "./academic-authorization.service";
import { AcademicReferenceService } from "./academic-reference.service";
import type {
  ApplicationDocumentLink,
  ApplicationEditableField,
  ApplicationSubmissionSnapshot,
  PostgraduateApplication,
} from "./academic.types";
import { ApplicantService } from "./applicant.service";
import { ApplicationDocumentGateway } from "./application-document.gateway";
import { ApplicationNotificationOutboxService } from "./application-notification-outbox.service";

interface DraftInput {
  programId: string;
  admissionCycleId: string;
}

interface CorrectionInput {
  programId?: string;
  admissionCycleId?: string;
}

interface MoreInfoInput {
  reason: string;
  requestedFields?: ApplicationEditableField[];
  requestedDocumentPurposes?: string[];
}

function copyApplication(record: PostgraduateApplication): PostgraduateApplication {
  return {
    ...record,
    attachedDocuments: record.attachedDocuments.map((link) => ({ ...link })),
    submissions: record.submissions.map((snapshot) => ({
      ...snapshot,
      requiredDocumentPurposes: [...snapshot.requiredDocumentPurposes],
      attachedDocuments: snapshot.attachedDocuments.map((link) => ({ ...link })),
    })),
    reviews: record.reviews.map((review) => ({ ...review })),
    needMoreInfoIntervals: record.needMoreInfoIntervals.map((range) => ({ ...range })),
    requestedFields: [...record.requestedFields],
    requestedDocumentPurposes: [...record.requestedDocumentPurposes],
    decision: record.decision ? { ...record.decision } : undefined,
  };
}

/**
 * TASK-PG-002 — FR-010/029/030/041; BR-006/036/041/057; UC-04.
 * Business transitions are explicit operations, never an arbitrary status PATCH.
 * In-memory prototype only: DB transaction/outbox and Document/Notification
 * integrations remain external handoffs, documented in TASK-PG-002.md.
 */
@Injectable()
export class ApplicationWorkflowService {
  private readonly applications = new Map<string, PostgraduateApplication>();

  constructor(
    private readonly applicants: ApplicantService,
    private readonly persons: PersonIdentityService,
    private readonly references: AcademicReferenceService,
    private readonly authorization: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
    private readonly documents: ApplicationDocumentGateway,
    private readonly notifications: ApplicationNotificationOutboxService,
  ) {}

  createDraft(
    input: DraftInput,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const person = this.applicants.getOwnPerson(principal);
    if (person.status !== "Active" || (!person.fullNameAr && !person.fullNameEn)) {
      throw this.invalid("FR-010/FR-041: active Person with a name required");
    }
    const programId = this.required(input?.programId, "programId");
    const admissionCycleId = this.required(input?.admissionCycleId, "admissionCycleId");
    const program = this.references.assertProgramEffective(programId, this.today());
    this.references.assertCycleAvailable(admissionCycleId, programId);
    this.ensureNoActiveDuplicate(person.personId, programId, admissionCycleId);

    const application: PostgraduateApplication = {
      applicationId: randomUUID(),
      personId: person.personId,
      studentId: this.applicants.getStudentForPerson(person.personId, program.institutionId)
        ?.studentId,
      programId,
      institutionId: program.institutionId,
      admissionCycleId,
      status: "Draft",
      createdAt: new Date().toISOString(),
      attachedDocuments: [],
      submissions: [],
      reviews: [],
      needMoreInfoIntervals: [],
      requestedDocumentPurposes: [],
      requestedFields: [],
    };
    this.audit.transition({
      entityType: "PostgraduateApplication",
      entityId: application.applicationId,
      toStatus: "Draft",
      actorUserId: principal.userId,
      sourceId: "FR-010",
    });
    this.applications.set(application.applicationId, application);
    return copyApplication(application);
  }

  /** A Draft is editable; after submission ONLY reviewer-requested corrections. */
  correctFields(
    applicationId: string,
    input: CorrectionInput,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireOwn(applicationId, principal);
    if (current.status !== "Draft" && current.status !== "NeedMoreInfo") {
      throw this.conflict("BR-041: submitted application is locked");
    }
    const keys = Object.keys(input ?? {});
    if (
      keys.length === 0 ||
      keys.some((key) => key !== "programId" && key !== "admissionCycleId")
    ) {
      throw this.invalid("FR-010: only defined application draft fields may be changed");
    }
    if (
      current.status === "NeedMoreInfo" &&
      keys.some((key) => !current.requestedFields.includes(key as ApplicationEditableField))
    ) {
      throw this.forbidden("BR-041: field was not requested by the reviewer");
    }
    const programId =
      input.programId === undefined
        ? current.programId
        : this.required(input.programId, "programId");
    const admissionCycleId =
      input.admissionCycleId === undefined
        ? current.admissionCycleId
        : this.required(input.admissionCycleId, "admissionCycleId");
    const program = this.references.assertProgramEffective(programId, this.today());
    this.references.assertCycleAvailable(admissionCycleId, programId);
    this.ensureNoActiveDuplicate(
      current.personId,
      programId,
      admissionCycleId,
      current.applicationId,
    );
    const next = copyApplication(current);
    next.programId = programId;
    next.institutionId = program.institutionId;
    next.admissionCycleId = admissionCycleId;
    next.studentId = this.applicants.getStudentForPerson(
      current.personId,
      program.institutionId,
    )?.studentId;
    this.audit.record(
      principal.userId,
      "postgraduate.application.fields.corrected",
      "PostgraduateApplication",
      next.applicationId,
      "FR-010/BR-041",
    );
    this.applications.set(next.applicationId, next);
    return copyApplication(next);
  }

  async linkDocument(
    applicationId: string,
    input: { documentId: string; purpose: string },
    principal: AuthorizationPrincipal,
  ): Promise<PostgraduateApplication> {
    const current = this.requireOwn(applicationId, principal);
    if (current.status !== "Draft" && current.status !== "NeedMoreInfo") {
      throw this.conflict("BR-041: submitted application documents are locked");
    }
    const purpose = this.required(input?.purpose, "purpose");
    const documentId = this.required(input?.documentId, "documentId");
    if (
      current.status === "NeedMoreInfo" &&
      !current.requestedDocumentPurposes.includes(purpose)
    ) {
      throw this.forbidden("BR-041: document purpose was not requested");
    }
    if (current.attachedDocuments.some((link) => link.documentId === documentId)) {
      throw this.conflict("BR-036: document already linked to this application");
    }
    // Domain adapter must confirm the actual target exists and document is
    // clean, classified, scoped to the applicant/institution and Available.
    await this.documents.assertLinkable({
      documentId,
      purpose,
      targetType: "PostgraduateApplication",
      targetId: current.applicationId,
      applicantPersonId: current.personId,
      institutionId: current.institutionId,
    });
    const next = copyApplication(current);
    const previousVersions = next.attachedDocuments.filter(
      (link) => link.purpose === purpose,
    );
    for (const previous of previousVersions) previous.isActive = false;
    const link: ApplicationDocumentLink = {
      documentLinkId: randomUUID(),
      documentId,
      targetType: "PostgraduateApplication",
      targetId: current.applicationId,
      purpose,
      versionNo: previousVersions.length + 1,
      isActive: true,
      linkedAt: new Date().toISOString(),
      linkedByUserId: principal.userId,
    };
    next.attachedDocuments.push(link); // all previous versions remain traceable
    this.audit.record(
      principal.userId,
      "postgraduate.application.document.linked",
      "PostgraduateApplication",
      next.applicationId,
      "FR-029/BR-036/BR-057",
    );
    this.applications.set(next.applicationId, next);
    return copyApplication(next);
  }

  async submitDraft(
    applicationId: string,
    principal: AuthorizationPrincipal,
  ): Promise<PostgraduateApplication> {
    const current = this.requireOwn(applicationId, principal);
    if (current.status !== "Draft") {
      throw this.conflict("FR-010: only Draft can be submitted initially");
    }
    await this.assertComplete(current, principal);
    const now = new Date().toISOString();
    const next = copyApplication(current);
    next.status = "Submitted";
    next.submittedAt = now;
    next.firstSubmittedAt = now;
    next.submissions.push(this.snapshot(next, now));
    this.audit.transition({
      entityType: "PostgraduateApplication",
      entityId: next.applicationId,
      fromStatus: "Draft",
      toStatus: "Submitted",
      actorUserId: principal.userId,
      sourceId: "FR-010/BR-006",
    });
    this.applications.set(next.applicationId, next);
    this.notifications.enqueue({
      applicationId: next.applicationId,
      personId: next.personId,
      event: "ApplicationSubmitted",
    });
    return copyApplication(next);
  }

  startReview(
    applicationId: string,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireApplication(applicationId);
    this.authorization.assertOfficer(
      principal,
      current.institutionId,
      current.programId,
    );
    if (current.status !== "Submitted") {
      throw this.conflict("FR-010: only Submitted enters UnderReview");
    }
    const next = copyApplication(current);
    next.status = "UnderReview";
    next.reviewAssignedToUserId = principal.userId;
    this.audit.transition({
      entityType: "PostgraduateApplication",
      entityId: next.applicationId,
      fromStatus: "Submitted",
      toStatus: "UnderReview",
      actorUserId: principal.userId,
      sourceId: "BR-041",
    });
    this.applications.set(next.applicationId, next);
    return copyApplication(next);
  }

  requestMoreInfo(
    applicationId: string,
    input: MoreInfoInput,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireApplication(applicationId);
    this.authorization.assertOfficer(
      principal,
      current.institutionId,
      current.programId,
    );
    if (current.status !== "UnderReview") {
      throw this.conflict("BR-041: NeedMoreInfo requires UnderReview");
    }
    const reason = this.required(input?.reason, "reason");
    if (!input || typeof input !== "object") {
      throw this.invalid("BR-041: request body is required");
    }
    if (
      (input.requestedFields !== undefined && !Array.isArray(input.requestedFields)) ||
      (input.requestedDocumentPurposes !== undefined &&
        !Array.isArray(input.requestedDocumentPurposes))
    ) {
      throw this.invalid("BR-041: requested fields and documents must be arrays");
    }
    const requestedFields = [...new Set(input.requestedFields ?? [])];
    if (
      requestedFields.some(
        (field) => field !== "programId" && field !== "admissionCycleId",
      )
    ) {
      throw this.invalid("BR-041: unknown correctable application field");
    }
    const requestedDocumentPurposes = [
      ...new Set((input.requestedDocumentPurposes ?? []).map((value) =>
        this.required(value, "requestedDocumentPurpose"),
      )),
    ];
    if (!requestedFields.length && !requestedDocumentPurposes.length) {
      throw this.invalid("BR-041: specify the fields or document purposes to correct");
    }
    const now = new Date().toISOString();
    const next = copyApplication(current);
    next.status = "NeedMoreInfo";
    next.needMoreInfoAt = now;
    next.requestedFields = requestedFields;
    next.requestedDocumentPurposes = requestedDocumentPurposes;
    next.reviews.push({
      applicationReviewId: randomUUID(),
      applicationId: next.applicationId,
      reviewerUserId: principal.userId,
      reviewType: "Eligibility",
      decision: "NeedMoreInfo",
      comments: reason,
      reviewedAt: now,
    });
    this.audit.transition({
      entityType: "PostgraduateApplication",
      entityId: next.applicationId,
      fromStatus: "UnderReview",
      toStatus: "NeedMoreInfo",
      actorUserId: principal.userId,
      sourceId: "BR-041",
      reasonCode: "NeedMoreInfo",
    });
    this.applications.set(next.applicationId, next);
    this.notifications.enqueue({
      applicationId: next.applicationId,
      personId: next.personId,
      event: "NeedMoreInfo",
    });
    return copyApplication(next);
  }

  async resubmit(
    applicationId: string,
    principal: AuthorizationPrincipal,
  ): Promise<PostgraduateApplication> {
    const current = this.requireOwn(applicationId, principal);
    if (current.status !== "NeedMoreInfo" || !current.needMoreInfoAt) {
      throw this.conflict("BR-041: only NeedMoreInfo may be resubmitted");
    }
    const previous = current.submissions[current.submissions.length - 1];
    for (const field of current.requestedFields) {
      if (!previous || previous[field] === current[field]) {
        throw this.invalid(`BR-041: requested field ${field} has not been corrected`);
      }
    }
    for (const purpose of current.requestedDocumentPurposes) {
      if (
        !current.attachedDocuments.some(
          (link) =>
            link.isActive &&
            link.purpose === purpose &&
            link.linkedAt >= current.needMoreInfoAt!,
        )
      ) {
        throw this.invalid(`BR-041: requested document ${purpose} has not been updated`);
      }
    }
    await this.assertComplete(current, principal, true);
    const now = new Date().toISOString();
    const next = copyApplication(current);
    next.status = "Submitted";
    next.submittedAt = now;
    next.resubmittedAt = now;
    next.needMoreInfoIntervals.push({ from: next.needMoreInfoAt!, to: now });
    next.needMoreInfoAt = undefined;
    next.requestedFields = [];
    next.requestedDocumentPurposes = [];
    next.reviewAssignedToUserId = undefined;
    next.submissions.push(this.snapshot(next, now));
    // BR-041: firstSubmittedAt is intentionally never changed.
    this.audit.transition({
      entityType: "PostgraduateApplication",
      entityId: next.applicationId,
      fromStatus: "NeedMoreInfo",
      toStatus: "Submitted",
      actorUserId: principal.userId,
      sourceId: "BR-041",
    });
    this.applications.set(next.applicationId, next);
    this.notifications.enqueue({
      applicationId: next.applicationId,
      personId: next.personId,
      event: "ApplicationResubmitted",
    });
    return copyApplication(next);
  }

  getOne(
    applicationId: string,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const record = this.requireApplication(applicationId);
    const applicantAccess =
      principal?.authenticated &&
      !!principal.personId &&
      this.sameCanonicalPerson(principal.personId, record.personId);
    if (
      !applicantAccess &&
      !this.authorization.canRead(
        principal,
        record.personId,
        record.institutionId,
        record.programId,
      )
    ) {
      throw this.forbidden("FR-010: application is outside user scope");
    }
    return copyApplication(record);
  }

  listMine(principal: AuthorizationPrincipal): PostgraduateApplication[] {
    const person = this.applicants.getOwnPerson(principal);
    return [...this.applications.values()]
      .filter((record) => this.sameCanonicalPerson(record.personId, person.personId))
      .map(copyApplication);
  }

  listForOfficer(
    institutionId: string,
    programId: string,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication[] {
    const institution = this.required(institutionId, "institutionId");
    const program = this.required(programId, "programId");
    this.authorization.assertOfficer(principal, institution, program);
    return [...this.applications.values()]
      .filter(
        (record) =>
          record.institutionId === institution && record.programId === program,
      )
      .map(copyApplication);
  }

  private async assertComplete(
    current: PostgraduateApplication,
    principal: AuthorizationPrincipal,
    isResubmission = false,
  ): Promise<void> {
    if (!current.personId || !current.programId || !current.admissionCycleId) {
      throw this.invalid("BR-006: mandatory application fields are missing");
    }
    const person = this.applicants.getOwnPerson(principal);
    if (!this.sameCanonicalPerson(person.personId, current.personId)) {
      throw this.forbidden("FR-010: application belongs to another person");
    }
    if (person.status !== "Active" || (!person.fullNameAr && !person.fullNameEn)) {
      throw this.invalid("BR-006: applicant Person is incomplete or inactive");
    }
    // The initial Submit needs an OPEN cycle. BR-041 resubmission is a
    // continuation of that submission and may happen after its close date.
    const program = isResubmission
      ? this.references.getProgram(current.programId)
      : this.references.assertProgramEffective(current.programId, this.today());
    if (program.institutionId !== current.institutionId) {
      throw this.conflict("BR-006: application program/institution mismatch");
    }
    if (isResubmission) {
      const cycle = this.references.getCycle(current.admissionCycleId);
      if (cycle.programId !== current.programId) {
        throw this.conflict("BR-006: application admission cycle/program mismatch");
      }
    } else {
      this.references.assertCycleAvailable(current.admissionCycleId, current.programId);
    }
    const previousSnapshot = current.submissions[current.submissions.length - 1];
    const requiredPurposes =
      isResubmission && previousSnapshot?.programId === current.programId
        ? previousSnapshot.requiredDocumentPurposes
        : program.requiredApplicationDocumentPurposes;
    const activePurposes = new Set(
      current.attachedDocuments
        .filter((link) => link.isActive)
        .map((link) => link.purpose),
    );
    const missing = requiredPurposes.filter(
      (purpose) => !activePurposes.has(purpose),
    );
    if (missing.length) {
      throw this.invalid(`BR-006: missing required documents (${missing.join(", ")})`);
    }
    // A document may be quarantined/revoked after it was first linked.
    // Never accept a stale "Available" signal supplied by the browser.
    for (const link of current.attachedDocuments.filter((item) => item.isActive)) {
      await this.documents.assertLinkable({
        documentId: link.documentId,
        purpose: link.purpose,
        targetType: "PostgraduateApplication",
        targetId: current.applicationId,
        applicantPersonId: current.personId,
        institutionId: current.institutionId,
      });
    }
  }

  private snapshot(
    application: PostgraduateApplication,
    now: string,
  ): ApplicationSubmissionSnapshot {
    return {
      snapshotId: randomUUID(),
      submittedAt: now,
      personId: application.personId,
      programId: application.programId,
      admissionCycleId: application.admissionCycleId,
      programVersionNo:
        application.submissions.length > 0 &&
        application.submissions[application.submissions.length - 1].programId ===
          application.programId
          ? application.submissions[application.submissions.length - 1]
              .programVersionNo
          : this.references.getProgram(application.programId).versionNo,
      requiredDocumentPurposes: [
        ...(application.submissions.length > 0 &&
        application.submissions[application.submissions.length - 1].programId ===
          application.programId
          ? application.submissions[application.submissions.length - 1]
              .requiredDocumentPurposes
          : this.references.getProgram(application.programId)
              .requiredApplicationDocumentPurposes),
      ],
      attachedDocuments: application.attachedDocuments
        .filter((link) => link.isActive)
        .map((link) => ({ ...link })),
      iteration: application.submissions.length + 1,
    };
  }

  private requireOwn(
    applicationId: string,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const record = this.requireApplication(applicationId);
    this.authorization.assertApplicant(principal, principal?.personId ?? "");
    if (!this.sameCanonicalPerson(principal.personId!, record.personId)) {
      throw this.forbidden("FR-010: applicant person scope mismatch");
    }
    return record;
  }

  private requireApplication(applicationId: string): PostgraduateApplication {
    const found = this.applications.get(applicationId);
    if (!found) {
      throw new AppException({
        code: ErrorCode.NotFound,
        status: HttpStatus.NOT_FOUND,
        message: "FR-010: application not found",
      });
    }
    return found;
  }

  private ensureNoActiveDuplicate(
    personId: string,
    programId: string,
    admissionCycleId: string,
    exceptId?: string,
  ): void {
    const duplicate = [...this.applications.values()].some(
      (record) =>
        record.applicationId !== exceptId &&
        this.sameCanonicalPerson(record.personId, personId) &&
        record.programId === programId &&
        record.admissionCycleId === admissionCycleId &&
        !["Rejected", "Withdrawn", "Cancelled"].includes(record.status),
    );
    if (duplicate) {
      // UC-04 permits blocking duplicate active requests; no silent duplication.
      throw this.conflict("UC-04: another active application exists for this cycle");
    }
  }

  private sameCanonicalPerson(first: string, second: string): boolean {
    return (
      this.persons.resolveCanonicalPersonId(first) ===
      this.persons.resolveCanonicalPersonId(second)
    );
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private required(value: string | undefined, field: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw this.invalid(`FR-010: ${field} is required`);
    }
    return value.trim();
  }

  private invalid(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }

  private conflict(message: string): AppException {
    return new AppException({
      code: ErrorCode.Conflict,
      status: HttpStatus.CONFLICT,
      message,
    });
  }

  private forbidden(message: string): AppException {
    return new AppException({
      code: ErrorCode.Forbidden,
      status: HttpStatus.FORBIDDEN,
      message,
    });
  }
}
