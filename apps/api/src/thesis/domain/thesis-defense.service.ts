import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { AcademicAuditService } from "../../postgraduate/domain/academic-audit.service";
import { AcademicAuthorizationService } from "../../postgraduate/domain/academic-authorization.service";
import { EnrollmentLifecycleService } from "../../postgraduate/domain/enrollment-lifecycle.service";
import { ThesisEntityService } from "./thesis-entity.service";
import {
  DefenseEligibilityGateway,
  type DefenseMemberAttestation,
} from "./defense-eligibility.gateway";
import type {
  CorrectionAttempt,
  DefenseCommittee,
  DefenseCommitteeMember,
  DefenseOutcome,
  DefenseSession,
  ThesisCorrection,
} from "./thesis-defense.types";

/**
 * TASK-TH-005–008. Explicit operations, immutable session history, no arbitrary
 * status endpoint. Prototype process-local Map state, not durable transactions.
 * Eligibility is a trusted fail-closed shared boundary, never a request flag.
 */
@Injectable()
export class ThesisDefenseService {
  private readonly committees = new Map<string, DefenseCommittee[]>();
  private readonly sessions = new Map<string, DefenseSession[]>();
  private readonly corrections = new Map<string, ThesisCorrection[]>();
  private readonly extraDefenseApprovals = new Map<
    string,
    { by: string; reason: string; at: string }
  >();

  constructor(
    private readonly theses: ThesisEntityService,
    private readonly enrollments: EnrollmentLifecycleService,
    private readonly authorization: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
    private readonly eligibility: DefenseEligibilityGateway,
  ) {}

  /** FR-018: a scoped PGA signs eligibility evidence, never the applicant. */
  async attestMember(
    thesisId: string,
    input: {
      member: DefenseCommitteeMember;
      conflictDeclared: boolean;
      reason: string;
    },
    principal: AuthorizationPrincipal,
  ): Promise<DefenseMemberAttestation> {
    const { thesis, enrollment } = this.context(thesisId, principal, true);
    if (
      thesis.status !== "Submitted" &&
      thesis.status !== "ReDefenseRequired"
    ) {
      throw this.conflict(
        "BR-015: committee attestation requires a submitted Thesis",
      );
    }
    const member = this.validMembers([input?.member])[0];
    return this.eligibility.recordAttestation({
      thesisId,
      enrollmentId: enrollment.enrollmentId,
      studentPersonId: enrollment.personId,
      institutionId: enrollment.institutionId,
      programId: enrollment.programId,
      member,
      conflictDeclared: input?.conflictDeclared,
      reason: this.required(input?.reason, "reason"),
      principal,
    });
  }

  /** FR-018/BR-016: proposal alone is not approval to schedule a defense. */
  async proposeCommittee(
    thesisId: string,
    input: { members: DefenseCommitteeMember[]; reason: string },
    principal: AuthorizationPrincipal,
  ): Promise<DefenseCommittee> {
    const { thesis, enrollment } = this.context(thesisId, principal, false);
    if (
      thesis.status !== "Submitted" &&
      thesis.status !== "ReDefenseRequired"
    ) {
      throw this.conflict(
        "BR-015: committee requires Submitted or ReDefenseRequired Thesis",
      );
    }
    const reason = this.required(input?.reason, "reason");
    const members = this.validMembers(input?.members);
    await this.eligibility.assertEligible({
      thesisId,
      enrollmentId: enrollment.enrollmentId,
      studentPersonId: enrollment.personId,
      institutionId: enrollment.institutionId,
      programId: enrollment.programId,
      members,
    });
    this.assertStatus(thesisId, principal, thesis.status);
    const committee: DefenseCommittee = {
      committeeId: randomUUID(),
      thesisId,
      members,
      reason,
      proposedByUserId: principal.userId,
      proposedAt: new Date().toISOString(),
      status: "Proposed",
    };
    this.audit.record(
      principal.userId,
      "ThesisCommittee.proposed",
      "ThesisCommittee",
      committee.committeeId,
      "FR-018/BR-016",
    );
    this.committees.set(thesisId, [...this.getCommittees(thesisId), committee]);
    return this.copyCommittee(committee);
  }

  async approveCommittee(
    thesisId: string,
    committeeId: string,
    principal: AuthorizationPrincipal,
  ): Promise<DefenseCommittee> {
    const { thesis, enrollment } = this.context(thesisId, principal, true);
    if (
      thesis.status !== "Submitted" &&
      thesis.status !== "ReDefenseRequired"
    ) {
      throw this.conflict(
        "BR-015: cannot approve committee in current Thesis state",
      );
    }
    const list = this.getCommittees(thesisId);
    const committee = list.find(
      (c) => c.committeeId === this.required(committeeId, "committeeId"),
    );
    if (!committee || committee.status !== "Proposed")
      throw this.conflict("BR-016: committee proposal not pending");
    if (list.at(-1)?.committeeId !== committeeId)
      throw this.conflict("BR-016: superseded committee proposal");
    await this.eligibility.assertEligible({
      thesisId,
      enrollmentId: enrollment.enrollmentId,
      studentPersonId: enrollment.personId,
      institutionId: enrollment.institutionId,
      programId: enrollment.programId,
      members: committee.members,
    });
    this.assertStatus(thesisId, principal, thesis.status);
    if (this.getCommittees(thesisId).at(-1) !== committee)
      throw this.conflict(
        "NFR-014: committee changed during eligibility verification",
      );
    const approved: DefenseCommittee = {
      ...committee,
      status: "Approved",
      approvedByUserId: principal.userId,
      approvedAt: new Date().toISOString(),
    };
    this.audit.record(
      principal.userId,
      "ThesisCommittee.approved",
      "ThesisCommittee",
      committeeId,
      "FR-018/BR-015/BR-016",
    );
    this.committees.set(
      thesisId,
      list.map((item) => (item.committeeId === committeeId ? approved : item)),
    );
    return this.copyCommittee(approved);
  }

  /** FR-019/BR-015: no schedule before genuine TH004 Submitted evidence. */
  async schedule(
    thesisId: string,
    input: { committeeId: string; scheduledAt: string },
    principal: AuthorizationPrincipal,
  ): Promise<DefenseSession> {
    const { thesis, enrollment } = this.context(thesisId, principal, true);
    if (
      thesis.status !== "Submitted" &&
      thesis.status !== "ReDefenseRequired"
    ) {
      throw this.conflict(
        "BR-015: defense scheduling requires Submitted or ReDefenseRequired",
      );
    }
    if (thesis.status === "Submitted") {
      await this.theses.assertSubmittedForDefense(thesisId, principal);
    }
    const committeeId = this.required(input?.committeeId, "committeeId");
    const committee = this.getCommittees(thesisId).find(
      (c) => c.committeeId === committeeId && c.status === "Approved",
    );
    if (
      !committee ||
      this.getCommittees(thesisId).at(-1)?.committeeId !== committeeId
    )
      throw this.conflict("BR-015/016: latest approved committee is required");
    // Revalidate at the decision boundary, in case eligibility changed.
    await this.eligibility.assertEligible({
      thesisId,
      enrollmentId: enrollment.enrollmentId,
      studentPersonId: enrollment.personId,
      institutionId: enrollment.institutionId,
      programId: enrollment.programId,
      members: committee.members,
    });
    const scheduledAt = this.timestamp(input?.scheduledAt, "scheduledAt");
    this.assertStatus(thesisId, principal, thesis.status);
    if (this.getCommittees(thesisId).at(-1) !== committee)
      throw this.conflict(
        "NFR-014: committee changed during eligibility verification",
      );
    const session: DefenseSession = {
      sessionId: randomUUID(),
      thesisId,
      committeeId,
      scheduledAt,
      scheduledByUserId: principal.userId,
      createdAt: new Date().toISOString(),
    };
    // Audit/status first; don't expose a session if it fails.
    this.theses.recordDefenseMilestone(
      thesisId,
      thesis.status,
      "DefenseScheduled",
      principal,
      "DefenseScheduled",
    );
    this.sessions.set(thesisId, [...this.getSessions(thesisId), session]);
    return { ...session };
  }

  /** Distinct minutes stage preserves DefenseScheduled -> Defended before outcome. */
  recordMinutes(
    thesisId: string,
    sessionId: string,
    input: { heldAt: string; minutes: string },
    principal: AuthorizationPrincipal,
  ): DefenseSession {
    this.context(thesisId, principal, true);
    this.assertStatus(thesisId, principal, "DefenseScheduled");
    const session = this.requireCurrentSession(thesisId, sessionId);
    if (session.heldAt)
      throw this.conflict("BR-017: defense minutes are immutable");
    const heldAt = this.timestamp(input?.heldAt, "heldAt");
    if (heldAt < session.scheduledAt)
      throw this.invalid(
        "FR-019: defense cannot be held before its scheduled date",
      );
    const minutes = this.required(input?.minutes, "minutes");
    const next = { ...session, heldAt, minutes };
    this.theses.recordDefenseMilestone(
      thesisId,
      "DefenseScheduled",
      "Defended",
      principal,
      "DefenseMinutesRecorded",
    );
    this.replaceSession(thesisId, next);
    return { ...next };
  }

  /** BR-017/046/047: each session has exactly one recorded outcome. */
  decideOutcome(
    thesisId: string,
    sessionId: string,
    input: { outcome: DefenseOutcome; reason: string; corrections?: string[] },
    principal: AuthorizationPrincipal,
  ): DefenseSession {
    const { thesis } = this.context(thesisId, principal, true);
    if (thesis.status !== "Defended")
      throw this.conflict("BR-017: record minutes before outcome");
    const session = this.requireCurrentSession(thesisId, sessionId);
    if (!session.heldAt || session.outcome)
      throw this.conflict("BR-017: session already decided or minutes missing");
    const reason = this.required(input?.reason, "reason");
    const allowed: DefenseOutcome[] = [
      "Pass",
      "PassWithCorrections",
      "ReDefense",
      "Fail",
    ];
    if (!allowed.includes(input?.outcome))
      throw this.invalid("BR-017: invalid defense outcome");
    const outcome = input.outcome;
    const corrections =
      outcome === "PassWithCorrections"
        ? this.correctionRequirements(input.corrections)
        : [];
    if (outcome !== "PassWithCorrections" && input.corrections?.length)
      throw this.invalid("BR-047: corrections require PassWithCorrections");
    if (
      outcome === "ReDefense" &&
      thesis.reDefenseCount >= 1 &&
      !this.extraDefenseApprovals.has(thesisId)
    ) {
      throw this.conflict(
        "BR-046: further defense requires explicit PGA exception",
      );
    }
    const target =
      outcome === "PassWithCorrections"
        ? "CorrectionsRequired"
        : outcome === "ReDefense"
          ? "ReDefenseRequired"
          : outcome === "Fail"
            ? "Failed"
            : undefined;
    const exception =
      outcome === "ReDefense" && thesis.reDefenseCount >= 1
        ? this.extraDefenseApprovals.get(thesisId)
        : undefined;
    const next: DefenseSession = {
      ...session,
      outcome,
      decisionReason: reason,
      decidedAt: new Date().toISOString(),
      decidedByUserId: principal.userId,
      ...(exception
        ? {
            extraDefenseException: {
              approvedByUserId: exception.by,
              approvedAt: exception.at,
              reason: exception.reason,
            },
          }
        : {}),
    };
    const created = corrections.map((requirement): ThesisCorrection => ({
      correctionId: randomUUID(),
      thesisId,
      sessionId,
      requirement,
      status: "Open",
      createdAt: next.decidedAt!,
      attempts: [],
    }));
    if (target)
      this.theses.recordDefenseMilestone(
        thesisId,
        "Defended",
        target,
        principal,
        `DefenseOutcome${outcome}`,
      );
    else
      this.audit.record(
        principal.userId,
        "DefenseSession.outcome.Pass",
        "DefenseSession",
        sessionId,
        "FR-019/BR-017",
      );
    this.replaceSession(thesisId, next);
    if (created.length)
      this.corrections.set(thesisId, [
        ...this.getCorrections(thesisId),
        ...created,
      ]);
    if (outcome === "ReDefense") this.extraDefenseApprovals.delete(thesisId);
    return { ...next };
  }

  /** Exception is scoped and actor-bound; caller cannot claim an approver. */
  approveExtraDefense(
    thesisId: string,
    reason: string,
    principal: AuthorizationPrincipal,
  ): void {
    const { thesis } = this.context(thesisId, principal, true);
    if (thesis.status !== "Defended" || thesis.reDefenseCount < 1)
      throw this.conflict("BR-046: no additional defense exception is needed");
    const justification = this.required(reason, "reason");
    this.audit.record(
      principal.userId,
      "Thesis.reDefense.exceptionApproved",
      "Thesis",
      thesisId,
      "BR-046",
    );
    this.extraDefenseApprovals.set(thesisId, {
      by: principal.userId,
      reason: justification,
      at: new Date().toISOString(),
    });
  }

  /** Student or authorized officer may submit; only PGA can independently verify. */
  submitCorrection(
    thesisId: string,
    correctionId: string,
    input: { evidenceNote: string },
    principal: AuthorizationPrincipal,
  ): ThesisCorrection {
    this.context(thesisId, principal, false, true);
    this.assertStatus(thesisId, principal, "CorrectionsRequired");
    const correction = this.requireCorrection(thesisId, correctionId);
    if (correction.status !== "Open")
      throw this.conflict("BR-047: correction already submitted or verified");
    const evidenceNote = this.required(input?.evidenceNote, "evidenceNote");
    const attempt: CorrectionAttempt = {
      evidenceNote,
      submittedByUserId: principal.userId,
      submittedAt: new Date().toISOString(),
    };
    const next: ThesisCorrection = {
      ...correction,
      status: "Submitted",
      attempts: [...correction.attempts, attempt],
    };
    this.audit.record(
      principal.userId,
      "ThesisCorrection.submitted",
      "ThesisCorrection",
      correctionId,
      "BR-047",
    );
    this.replaceCorrection(thesisId, next);
    return this.copyCorrection(next);
  }

  verifyCorrection(
    thesisId: string,
    correctionId: string,
    input: { approved: boolean; reason: string },
    principal: AuthorizationPrincipal,
  ): ThesisCorrection {
    this.context(thesisId, principal, true);
    this.assertStatus(thesisId, principal, "CorrectionsRequired");
    const correction = this.requireCorrection(thesisId, correctionId);
    if (correction.status !== "Submitted" || !correction.attempts.length)
      throw this.conflict("BR-047: submit a correction before verification");
    if (typeof input?.approved !== "boolean")
      throw this.invalid("BR-047: approved must be boolean");
    const reason = this.required(input.reason, "reason");
    const attempts = correction.attempts.map((item) => ({ ...item }));
    attempts[attempts.length - 1] = {
      ...attempts[attempts.length - 1],
      verifiedByUserId: principal.userId,
      verifiedAt: new Date().toISOString(),
      approved: input.approved,
      verificationReason: reason,
    };
    const next: ThesisCorrection = {
      ...correction,
      status: input.approved ? "Verified" : "Open",
      attempts,
    };
    this.audit.record(
      principal.userId,
      input.approved
        ? "ThesisCorrection.verified"
        : "ThesisCorrection.rejected",
      "ThesisCorrection",
      correctionId,
      "BR-018/BR-047",
    );
    this.replaceCorrection(thesisId, next);
    return this.copyCorrection(next);
  }

  /** TH008: Thesis approval is not DegreeDecision (PG005 remains authority). */
  approveThesis(
    thesisId: string,
    reason: string,
    principal: AuthorizationPrincipal,
  ) {
    const { thesis } = this.context(thesisId, principal, true);
    const justification = this.required(reason, "reason");
    const last = this.getSessions(thesisId).at(-1);
    if (!last || !last.outcome || !last.heldAt)
      throw this.conflict("BR-017: verified defense outcome required");
    if (thesis.status === "Defended" && last.outcome !== "Pass")
      throw this.conflict("BR-018: only Pass may be directly approved");
    if (thesis.status === "CorrectionsRequired") {
      if (last.outcome !== "PassWithCorrections")
        throw this.conflict("BR-018: corrections outcome mismatch");
      const associated = this.getCorrections(thesisId).filter(
        (c) => c.sessionId === last.sessionId,
      );
      if (
        !associated.length ||
        associated.some(
          (c) =>
            c.status !== "Verified" ||
            !c.attempts.at(-1)?.verifiedByUserId ||
            !c.attempts.at(-1)?.verifiedAt,
        )
      ) {
        throw this.conflict(
          "BR-018/BR-047: all mandatory corrections must be verified and closed",
        );
      }
    } else if (thesis.status !== "Defended") {
      throw this.conflict("BR-018: Thesis is not eligible for final approval");
    }
    const next = this.theses.recordDefenseMilestone(
      thesisId,
      thesis.status,
      "Approved",
      principal,
      `ThesisApproved:${justification.slice(0, 100)}`,
    );
    return next;
  }

  archive(thesisId: string, reason: string, principal: AuthorizationPrincipal) {
    const { thesis } = this.context(thesisId, principal, true);
    this.required(reason, "reason");
    if (thesis.status !== "Approved" && thesis.status !== "Failed")
      throw this.conflict("BR-026: archive only final Thesis outcomes");
    return this.theses.recordDefenseMilestone(
      thesisId,
      thesis.status,
      "Archived",
      principal,
      "ThesisArchived",
    );
  }

  listCommittees(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): DefenseCommittee[] {
    this.context(thesisId, principal, false, true);
    this.audit.record(
      principal.userId,
      "ThesisCommittee.read",
      "Thesis",
      thesisId,
      "NFR-011/FR-037",
    );
    return this.getCommittees(thesisId).map((x) => this.copyCommittee(x));
  }
  listSessions(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): DefenseSession[] {
    this.context(thesisId, principal, false, true);
    this.audit.record(
      principal.userId,
      "DefenseSession.read",
      "Thesis",
      thesisId,
      "NFR-011/FR-037",
    );
    return this.getSessions(thesisId).map((x) => ({
      ...x,
      extraDefenseException: x.extraDefenseException
        ? { ...x.extraDefenseException }
        : undefined,
    }));
  }
  listCorrections(
    thesisId: string,
    principal: AuthorizationPrincipal,
  ): ThesisCorrection[] {
    this.context(thesisId, principal, false, true);
    this.audit.record(
      principal.userId,
      "ThesisCorrection.read",
      "Thesis",
      thesisId,
      "NFR-011/FR-037",
    );
    return this.getCorrections(thesisId).map((x) => this.copyCorrection(x));
  }

  private context(
    thesisId: string,
    principal: AuthorizationPrincipal,
    authority: boolean,
    allowApplicant = false,
  ) {
    const thesis = this.theses.getOne(thesisId, principal);
    const enrollment = this.enrollments.getOne(thesis.enrollmentId, principal);
    if (
      allowApplicant &&
      principal?.authenticated &&
      principal.personId === enrollment.personId
    ) {
      return { thesis, enrollment };
    }
    if (authority)
      this.authorization.assertAuthority(
        principal,
        enrollment.institutionId,
        enrollment.programId,
      );
    else
      this.authorization.assertOfficer(
        principal,
        enrollment.institutionId,
        enrollment.programId,
      );
    return { thesis, enrollment };
  }
  private assertStatus(
    thesisId: string,
    principal: AuthorizationPrincipal,
    expected: string,
  ) {
    if (this.theses.getOne(thesisId, principal).status !== expected)
      throw this.conflict("NFR-014: Thesis status changed; retry");
  }
  private validMembers(value: unknown): DefenseCommitteeMember[] {
    if (!Array.isArray(value) || value.length === 0 || value.length > 20)
      throw this.invalid("BR-016: a nonempty bounded committee is required");
    const members = value.map((member: unknown) => {
      if (!member || typeof member !== "object")
        throw this.invalid("BR-016: invalid member");
      const item = member as Record<string, unknown>;
      return {
        personId: this.required(item.personId, "personId"),
        role: this.required(item.role, "role"),
      };
    });
    if (members.some((m) => m.personId.length > 128 || m.role.length > 80))
      throw this.invalid("BR-016: member fields too long");
    if (new Set(members.map((m) => m.personId)).size !== members.length)
      throw this.conflict("BR-016: duplicate committee member");
    return members;
  }
  private correctionRequirements(value: unknown): string[] {
    if (!Array.isArray(value) || value.length < 1 || value.length > 50)
      throw this.invalid(
        "BR-047: PassWithCorrections needs a bounded nonempty list",
      );
    const items = value.map((x) => this.required(x, "correction"));
    if (new Set(items).size !== items.length)
      throw this.invalid("BR-047: duplicate correction requirement");
    return items;
  }
  private requireCurrentSession(thesisId: string, id: string): DefenseSession {
    const current = this.getSessions(thesisId).at(-1);
    if (!current || current.sessionId !== this.required(id, "sessionId"))
      throw this.conflict(
        "BR-017: session is not the current scheduled defense",
      );
    return current;
  }
  private requireCorrection(thesisId: string, id: string): ThesisCorrection {
    const c = this.getCorrections(thesisId).find(
      (x) => x.correctionId === this.required(id, "correctionId"),
    );
    if (!c) throw this.conflict("BR-047: correction does not exist on Thesis");
    return c;
  }
  private replaceSession(thesisId: string, next: DefenseSession) {
    this.sessions.set(
      thesisId,
      this.getSessions(thesisId).map((x) =>
        x.sessionId === next.sessionId ? next : x,
      ),
    );
  }
  private replaceCorrection(thesisId: string, next: ThesisCorrection) {
    this.corrections.set(
      thesisId,
      this.getCorrections(thesisId).map((x) =>
        x.correctionId === next.correctionId ? next : x,
      ),
    );
  }
  private getCommittees(id: string) {
    return this.committees.get(id) ?? [];
  }
  private getSessions(id: string) {
    return this.sessions.get(id) ?? [];
  }
  private getCorrections(id: string) {
    return this.corrections.get(id) ?? [];
  }
  private copyCommittee(item: DefenseCommittee): DefenseCommittee {
    return { ...item, members: item.members.map((m) => ({ ...m })) };
  }
  private copyCorrection(item: ThesisCorrection): ThesisCorrection {
    return { ...item, attempts: item.attempts.map((a) => ({ ...a })) };
  }
  private required(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim() || value.length > 4000)
      throw this.invalid(`${field} is required (maximum 4000 characters)`);
    return value.trim();
  }
  private timestamp(value: unknown, field: string): string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString() !== value
    ) {
      throw this.invalid(`${field} must be exact ISO UTC`);
    }
    return value;
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
}
