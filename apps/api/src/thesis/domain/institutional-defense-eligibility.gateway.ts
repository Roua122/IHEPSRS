import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { AcademicAuthorizationService } from "../../postgraduate/domain/academic-authorization.service";
import { AcademicAuditService } from "../../postgraduate/domain/academic-audit.service";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { ConflictOfInterestService } from "../../research/domain/conflict-of-interest.service";
import {
  DefenseEligibilityGateway,
  type DefenseMemberAttestation,
  type DefenseMemberAttestationInput,
} from "./defense-eligibility.gateway";
import type { DefenseCommitteeMember } from "./thesis-defense.types";

/**
 * FR-018/BR-016: prototype institutional-attestation adapter. A PGA may
 * certify a named member/role after checking the institution's source records.
 * The adapter ALSO checks the canonical active Researcher registry and any
 * available research COI evidence; positive attestations never override a
 * detected conflict. Attestations are append-only and are bound to a thesis,
 * institution, program, role and signed PGA identity. This is *not* proof of
 * an external HR/COI registry, external examiners or production persistence.
 */
@Injectable()
export class InstitutionalDefenseEligibilityGateway extends DefenseEligibilityGateway {
  private readonly attestations = new Map<string, DefenseMemberAttestation[]>();

  constructor(
    private readonly authorization: AcademicAuthorizationService,
    private readonly persons: PersonIdentityService,
    private readonly conflicts: ConflictOfInterestService,
    private readonly audit: AcademicAuditService,
  ) {
    super();
  }

  async recordAttestation(
    input: DefenseMemberAttestationInput,
  ): Promise<DefenseMemberAttestation> {
    this.authorization.assertAuthority(
      input.principal,
      input.institutionId,
      input.programId,
    );
    this.validateInput(input);
    const subject = this.assertActiveInternalMember(
      input.member,
      input.institutionId,
      input.studentPersonId,
    );
    // Record a declared conflict as an auditable *negative* attestation. It
    // invalidates any previously positive record without deleting history.
    if (!input.conflictDeclared) {
      this.assertNoKnownConflict(input.studentPersonId, subject.researcherId);
    }
    const attestation: DefenseMemberAttestation = {
      attestationId: randomUUID(),
      thesisId: input.thesisId,
      institutionId: input.institutionId,
      programId: input.programId,
      member: { personId: input.member.personId, role: input.member.role },
      conflictDeclared: input.conflictDeclared,
      reason: input.reason.trim(),
      attestedByUserId: input.principal.userId,
      attestedAt: new Date().toISOString(),
    };
    // If audit fails, do not publish an attestation. No untrusted reason in logs.
    this.audit.record(
      input.principal.userId,
      input.conflictDeclared
        ? "ThesisCommittee.member.conflictDeclared"
        : "ThesisCommittee.member.attested",
      "Thesis",
      input.thesisId,
      "FR-018/BR-016",
    );
    this.attestations.set(input.thesisId, [
      ...(this.attestations.get(input.thesisId) ?? []),
      attestation,
    ]);
    return { ...attestation, member: { ...attestation.member } };
  }

  async assertEligible(input: {
    thesisId: string;
    enrollmentId: string;
    studentPersonId?: string;
    institutionId: string;
    programId: string;
    members: readonly DefenseCommitteeMember[];
  }): Promise<void> {
    if (!input.studentPersonId || !input.members.length) {
      throw this.conflict(
        "FR-018: verified Thesis student and committee are required",
      );
    }
    const saved = this.attestations.get(input.thesisId) ?? [];
    for (const member of input.members) {
      const profile = this.assertActiveInternalMember(
        member,
        input.institutionId,
        input.studentPersonId,
      );
      const latestAttestation = [...saved]
        .reverse()
        .find(
          (item) =>
            item.institutionId === input.institutionId &&
            item.programId === input.programId &&
            item.member.personId === member.personId &&
            item.member.role === member.role,
        );
      if (!latestAttestation || latestAttestation.conflictDeclared) {
        throw this.conflict(
          "FR-018: member lacks a current no-conflict institutional attestation",
        );
      }
      this.assertNoKnownConflict(input.studentPersonId, profile.researcherId);
    }
  }

  private validateInput(input: DefenseMemberAttestationInput): void {
    const fields = [
      input.thesisId,
      input.enrollmentId,
      input.studentPersonId,
      input.institutionId,
      input.programId,
      input.member?.personId,
      input.member?.role,
      input.reason,
    ];
    if (
      fields.some(
        (x) => typeof x !== "string" || !x.trim() || x.length > 500,
      ) ||
      typeof input.conflictDeclared !== "boolean"
    ) {
      throw this.invalid(
        "FR-018: complete bounded institutional attestation is required",
      );
    }
    if (
      input.principal.personId === input.member.personId ||
      input.principal.personId === input.studentPersonId
    ) {
      throw this.conflict(
        "FR-018: subject or student may not attest own committee eligibility",
      );
    }
  }

  private assertActiveInternalMember(
    member: DefenseCommitteeMember,
    institutionId: string,
    studentPersonId: string,
  ) {
    if (member.personId === studentPersonId)
      throw this.conflict("FR-018: student cannot examine their own Thesis");
    const researcher = this.persons.getResearcherByPersonId(member.personId);
    if (
      !researcher ||
      researcher.status !== "Active" ||
      researcher.institutionId !== institutionId
    ) {
      throw this.conflict(
        "FR-018: active same-institution Researcher identity is required in prototype",
      );
    }
    if (this.persons.getPerson(member.personId).status !== "Active") {
      throw this.conflict(
        "FR-018: inactive person cannot be a committee member",
      );
    }
    return researcher;
  }

  private assertNoKnownConflict(
    studentPersonId: string,
    memberResearcherId: string,
  ): void {
    const studentResearcher =
      this.persons.getResearcherByPersonId(studentPersonId);
    if (!studentResearcher) return; // PGA attestation covers manual declaration; no fabricated researcher mapping.
    const verdict = this.conflicts.evaluate({
      principalResearcherId: studentResearcher.researcherId,
      reviewerId: memberResearcherId,
      hasDeclaredConflict: false, // A signed no-conflict PGA attestation was required first.
    });
    if (verdict.conflict)
      throw this.conflict(
        "FR-018: canonical Research COI evidence denies this examiner",
      );
  }

  private invalid(message: string): AppException {
    return new AppException({
      code: ErrorCode.Validation,
      status: HttpStatus.BAD_REQUEST,
      message,
    });
  }
  private conflict(message: string): AppException {
    return new AppException({
      code: ErrorCode.Conflict,
      status: HttpStatus.CONFLICT,
      message,
    });
  }
}
