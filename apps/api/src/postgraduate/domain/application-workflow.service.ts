import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { BusinessPolicyService } from "../../config/business-policy.service";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { AcademicAuditService } from "./academic-audit.service";
import { AcademicAuthorizationService } from "./academic-authorization.service";
import { AcademicReferenceService } from "./academic-reference.service";
import type {
  AdmissionDecision,
  ApplicationDocumentLink,
  ApplicationEditableField,
  ApplicationReview,
  ApplicationSubmissionSnapshot,
  PostgraduateApplication,
} from "./academic.types";
import { ApplicantService } from "./applicant.service";
import { ApplicationDocumentGateway } from "./application-document.gateway";
import { ApplicationNotificationOutboxService } from "./application-notification-outbox.service";
import {
  AdmissionDecisionEvidenceService,
  type AdmissionEnrollmentEvidence,
  type AdmissionEnrollmentTarget,
} from "./admission-decision-evidence.service";

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

interface ReviewInput {
  reviewType: "Eligibility" | "Academic";
  recommendation?: "Approve" | "Reject";
  comments?: string;
}

interface DecisionInput {
  outcome: AdmissionDecision["outcome"];
  reason: string;
  conditions?: string;
}

/** FR-011/BR-041: decision SLA time excluding every NeedMoreInfo interval. */
export interface ApplicationReviewTiming {
  firstSubmittedAt: string;
  decidedAt?: string;
  calculatedAt: string;
  excludedNeedMoreInfoMs: number;
  effectiveDecisionMs: number;
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
    private readonly policies: BusinessPolicyService,
    private readonly admissionEvidence: AdmissionDecisionEvidenceService,
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

  /**
   * FR-011: scoped reviewer claims an unassigned Submitted application.
   * Assignment of a different user must wait for a trusted IAM directory;
   * user-supplied reviewer IDs are never trusted as proof of eligibility.
   */
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
      sourceId: "FR-011",
    });
    this.applications.set(next.applicationId, next);
    return copyApplication(next);
  }

  /**
   * FR-011: only the assigned reviewer may add notes or recommendations.
   * The higher-privilege final acceptance/rejection is a separate operation.
   */
  recordReview(
    applicationId: string,
    input: ReviewInput,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireApplication(applicationId);
    this.assertAssignedReviewer(current, principal);
    if (current.status !== "UnderReview" || current.decision) {
      throw this.conflict("FR-011: review notes require an undecided UnderReview application");
    }
    if (input?.reviewType !== "Eligibility" && input?.reviewType !== "Academic") {
      throw this.invalid("FR-011: reviewType must be Eligibility or Academic");
    }
    if (
      input.recommendation !== undefined &&
      input.recommendation !== "Approve" &&
      input.recommendation !== "Reject"
    ) {
      throw this.invalid("FR-011: invalid review recommendation");
    }
    const comments = this.optionalText(input.comments, "comments");
    if (!comments && !input.recommendation) {
      throw this.invalid("FR-011: review must include comments or a recommendation");
    }
    if (input.recommendation === "Reject" && !comments) {
      throw this.invalid("BR-007: rejection recommendation must include a reason");
    }
    const next = copyApplication(current);
    const review: ApplicationReview = {
      applicationReviewId: randomUUID(),
      applicationId: next.applicationId,
      reviewerUserId: principal.userId,
      reviewType: input.reviewType,
      decision: input.recommendation,
      comments,
      reviewedAt: new Date().toISOString(),
    };
    next.reviews.push(review);
    this.audit.record(
      principal.userId,
      "postgraduate.application.review.recorded",
      "PostgraduateApplication",
      next.applicationId,
      "FR-011",
    );
    this.applications.set(next.applicationId, next);
    return copyApplication(next);
  }

  /**
   * FR-012: final outcomes require PGA authority; the PGO review alone
   * never grants acceptance. Conditional decisions remain UnderReview until
   * an authority verifies the conditions, so PG004 cannot enroll prematurely.
   */
  decide(
    applicationId: string,
    input: DecisionInput,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireApplication(applicationId);
    this.authorization.assertAuthority(principal, current.institutionId, current.programId);
    if (current.status !== "UnderReview" || current.decision) {
      throw this.conflict("FR-012: only an undecided UnderReview application can be decided");
    }
    if (!current.reviewAssignedToUserId || !current.reviews.some(
      (entry) => entry.reviewerUserId === current.reviewAssignedToUserId &&
        entry.reviewType !== "Final",
    )) {
      throw this.conflict("FR-011: an assigned reviewer must record the review first");
    }
    if (
      input?.outcome !== "Accepted" &&
      input?.outcome !== "Rejected" &&
      input?.outcome !== "ConditionalAccepted"
    ) {
      throw this.invalid("FR-012: invalid admission decision outcome");
    }
    // PG004/BR-008: decisions must bind to the same submitted Person,
    // program and admission cycle that the assigned officer actually reviewed.
    this.admissionEvidence.assertLatestSubmissionConsistent(current);
    // FR-012 requires an explicit decision reason (BR-007 also requires it
    // for every rejection). Never derive a reason from a client status field.
    const reason = this.required(input.reason, "reason");
    const conditions = this.optionalText(input.conditions, "conditions");
    if (input.outcome === "ConditionalAccepted" && !conditions) {
      throw this.invalid("FR-012: conditional acceptance requires conditions");
    }
    if (input.outcome !== "ConditionalAccepted" && conditions) {
      throw this.invalid("FR-012: conditions are only valid for conditional acceptance");
    }
    const now = new Date().toISOString();
    // BR-038/BR-062: pin the approved effective policy version at the event.
    // Do not take policyVersionId from a caller-controlled HTTP payload.
    const policyVersionId = this.policies.getPolicyAt(new Date(now)).policyVersion;
    const next = copyApplication(current);
    next.decision = {
      decisionId: randomUUID(),
      outcome: input.outcome,
      decidedByUserId: principal.userId,
      decidedAt: now,
      reason,
      conditions: input.outcome === "ConditionalAccepted" ? conditions : undefined,
      policyVersionId,
    };
    next.reviews.push({
      applicationReviewId: randomUUID(),
      applicationId: next.applicationId,
      reviewerUserId: principal.userId,
      reviewType: "Final",
      decision: input.outcome === "Rejected" ? "Reject" : "Approve",
      comments: reason,
      reviewedAt: now,
    });
    if (input.outcome === "ConditionalAccepted") {
      // The Baseline has no extra ApplicationStatus for conditional approval.
      // Keep it UnderReview until a separate, auditable clearance operation.
      this.audit.record(
        principal.userId,
        "postgraduate.application.decision.conditional",
        "PostgraduateApplication",
        next.applicationId,
        "FR-012",
      );
    } else {
      next.status = input.outcome;
      this.audit.transition({
        entityType: "PostgraduateApplication",
        entityId: next.applicationId,
        fromStatus: "UnderReview",
        toStatus: next.status,
        actorUserId: principal.userId,
        sourceId: "FR-012/BR-007",
        reasonCode: input.outcome,
      });
    }
    this.applications.set(next.applicationId, next);
    this.notifications.enqueue({
      applicationId: next.applicationId,
      personId: next.personId,
      event: input.outcome === "Accepted"
        ? "ApplicationAccepted"
        : input.outcome === "Rejected"
          ? "ApplicationRejected"
          : "ApplicationConditionallyAccepted",
    });
    return copyApplication(next);
  }

  /** FR-012/BR-008: only cleared conditional approvals become Accepted. */
  clearAdmissionConditions(
    applicationId: string,
    input: { clearanceEvidence: string },
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireApplication(applicationId);
    this.authorization.assertAuthority(principal, current.institutionId, current.programId);
    if (
      current.status !== "UnderReview" ||
      current.decision?.outcome !== "ConditionalAccepted" ||
      current.decision.conditionsClearedAt
    ) {
      throw this.conflict("FR-012: no outstanding conditional acceptance to clear");
    }
    this.admissionEvidence.assertLatestSubmissionConsistent(current);
    const evidence = this.required(input?.clearanceEvidence, "clearanceEvidence");
    const now = new Date().toISOString();
    const next = copyApplication(current);
    next.status = "Accepted";
    next.decision!.conditionsClearedAt = now;
    next.reviews.push({
      applicationReviewId: randomUUID(),
      applicationId: next.applicationId,
      reviewerUserId: principal.userId,
      reviewType: "Final",
      decision: "Approve",
      comments: evidence,
      reviewedAt: now,
    });
    this.audit.transition({
      entityType: "PostgraduateApplication",
      entityId: next.applicationId,
      fromStatus: "UnderReview",
      toStatus: "Accepted",
      actorUserId: principal.userId,
      sourceId: "FR-012/BR-008",
      reasonCode: "ConditionalAcceptanceCleared",
    });
    this.applications.set(next.applicationId, next);
    this.notifications.enqueue({
      applicationId: next.applicationId,
      personId: next.personId,
      event: "AdmissionConditionsCleared",
    });
    return copyApplication(next);
  }

  requestMoreInfo(
    applicationId: string,
    input: MoreInfoInput,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication {
    const current = this.requireApplication(applicationId);
    this.assertAssignedReviewer(current, principal);
    if (current.status !== "UnderReview" || current.decision) {
      throw this.conflict("BR-041: NeedMoreInfo requires undecided UnderReview");
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

  /**
   * TASK-PG-004 / BR-008 / NFR-011: internal handoff to PG005.
   * No HTTP endpoint is exposed here; the trusted Enrollment operation passes
   * its actual proposed startDate and matching identity/program/cycle fields.
   * Calling this method does NOT create an Enrollment or authorize Active by
   * itself. PG005 must still validate the student and enrollment constraints.
   */
  admissionEvidenceForEnrollment(
    applicationId: string,
    target: AdmissionEnrollmentTarget,
    principal: AuthorizationPrincipal,
  ): AdmissionEnrollmentEvidence {
    const application = this.requireApplication(applicationId);
    this.authorization.assertOfficer(
      principal,
      application.institutionId,
      application.programId,
    );
    const evidence = this.admissionEvidence.assessForEnrollment(application, target);
    this.audit.record(
      principal.userId,
      "postgraduate.admission.enrollment-evidence.read",
      "PostgraduateApplication",
      application.applicationId,
      "FR-012/BR-008/NFR-011",
    );
    return evidence;
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

  /** BR-041/NFR-021: effective decision clock excludes NeedMoreInfo pauses. */
  getReviewTiming(
    applicationId: string,
    principal: AuthorizationPrincipal,
    at = new Date(),
  ): ApplicationReviewTiming {
    const current = this.getOne(applicationId, principal);
    if (!current.firstSubmittedAt) {
      throw this.conflict("FR-011: application has never been submitted");
    }
    const firstMs = Date.parse(current.firstSubmittedAt);
    const effectiveEnd = current.decision?.decidedAt ?? at.toISOString();
    const endMs = Date.parse(effectiveEnd);
    const completeIntervals = current.needMoreInfoIntervals;
    const liveIntervals = current.needMoreInfoAt
      ? [...completeIntervals, { from: current.needMoreInfoAt, to: effectiveEnd }]
      : completeIntervals;
    let excluded = 0;
    for (const interval of liveIntervals) {
      const from = Math.max(firstMs, Date.parse(interval.from));
      const to = Math.min(endMs, Date.parse(interval.to));
      excluded += Math.max(0, to - from);
    }
    return {
      firstSubmittedAt: current.firstSubmittedAt,
      decidedAt: current.decision?.decidedAt,
      calculatedAt: at.toISOString(),
      excludedNeedMoreInfoMs: excluded,
      effectiveDecisionMs: Math.max(0, endMs - firstMs - excluded),
    };
  }

  listAssignedToMe(
    institutionId: string,
    programId: string,
    principal: AuthorizationPrincipal,
  ): PostgraduateApplication[] {
    return this.listForOfficer(institutionId, programId, principal)
      .filter((record) => record.reviewAssignedToUserId === principal.userId);
  }

  private assertAssignedReviewer(
    application: PostgraduateApplication,
    principal: AuthorizationPrincipal,
  ): void {
    this.authorization.assertOfficer(principal, application.institutionId, application.programId);
    if (!application.reviewAssignedToUserId || application.reviewAssignedToUserId !== principal.userId) {
      throw this.forbidden("FR-011/BR-041: review is assigned to another officer");
    }
  }

  private optionalText(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string") throw this.invalid(`FR-011/FR-012: ${field} must be text`);
    const trimmed = value.trim();
    return trimmed || undefined;
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
