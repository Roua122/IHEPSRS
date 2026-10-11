import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { PersonIdentityService } from "../../research/domain/person-identity.service";
import { AcademicAuditService } from "./academic-audit.service";
import { AcademicAuthorizationService } from "./academic-authorization.service";
import type { SyncedStudentRecord } from "./academic.types";

/** PG001 / FR-041, FR-042, BR-004/005/055. */
@Injectable()
export class ApplicantService {
  private readonly students = new Map<string, SyncedStudentRecord>();
  private readonly sourceIds = new Map<string, string>();

  constructor(
    private readonly persons: PersonIdentityService,
    private readonly auth: AcademicAuthorizationService,
    private readonly audit: AcademicAuditService,
  ) {}

  registerSelf(
    dto: {
      fullNameAr?: string;
      fullNameEn?: string;
      email?: string;
      birthDate?: string;
    },
    principal: AuthorizationPrincipal,
  ) {
    const id = principal.personId ?? "";
    this.auth.assertApplicant(principal, id);
    const before = this.persons
      .getAllPersons()
      .some((person) => person.personId === id);
    const person = this.persons.registerApplicantPerson({
      ...dto,
      personId: id,
    });
    if (!before) {
      this.audit.record(
        principal.userId,
        "applicant.person.created",
        "Person",
        id,
        "FR-041",
      );
    }
    return person;
  }

  getOwnPerson(principal: AuthorizationPrincipal) {
    const personId = principal.personId ?? "";
    this.auth.assertApplicant(principal, personId);
    const canonical = this.persons.resolveCanonicalPersonId(personId);
    return this.persons.getPerson(canonical);
  }

  /**
   * INT-owned entry point, not an exposed controller action. The caller must be
   * a trusted integration adapter that already authenticated the source system,
   * validated institution boundary, idempotency and source version.
   * Academic fields remain SIS-owned: users cannot write via Applicant API.
   */
  acceptTrustedStudentUpsert(dto: {
    studentId?: string;
    personId: string;
    institutionId: string;
    sourceSystem: string;
    externalStudentId: string;
    academicStatus: string;
    lastSourceUpdateAt: string;
    sourceVersion?: string;
  }): SyncedStudentRecord {
    const personId = this.persons.resolveCanonicalPersonId(dto.personId);
    if (
      !dto.institutionId?.trim() ||
      !dto.sourceSystem?.trim() ||
      !dto.externalStudentId?.trim() ||
      !dto.academicStatus?.trim() ||
      !Number.isFinite(Date.parse(dto.lastSourceUpdateAt))
    ) {
      throw new AppException({
        code: ErrorCode.Validation,
        message:
          "FR-041/BR-004: source, external id and academic fields required",
      });
    }
    const key = `${dto.sourceSystem}\u0000${dto.externalStudentId}`;
    const existingId = this.sourceIds.get(key);
    const existing = existingId ? this.students.get(existingId) : undefined;
    if (
      existing &&
      (this.persons.resolveCanonicalPersonId(existing.personId) !== personId ||
        existing.institutionId !== dto.institutionId)
    ) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message:
          "BR-031/BR-055: conflicting SIS identity mapping needs Data Steward",
      });
    }
    if (
      existing &&
      Date.parse(dto.lastSourceUpdateAt) <=
        Date.parse(existing.lastSourceUpdateAt)
    ) {
      // BR-030, BR-056: duplicate or stale source events never overwrite newer.
      return { ...existing };
    }
    const student: SyncedStudentRecord = {
      studentId: existing?.studentId ?? dto.studentId?.trim() ?? randomUUID(),
      personId,
      institutionId: dto.institutionId,
      sourceSystem: dto.sourceSystem,
      externalStudentId: dto.externalStudentId,
      academicStatus: dto.academicStatus,
      lastSourceUpdateAt: dto.lastSourceUpdateAt,
      sourceVersion: dto.sourceVersion,
    };
    this.students.set(student.studentId, student);
    this.sourceIds.set(key, student.studentId);
    this.audit.record(
      "trusted-sis-adapter",
      "student.sis.upsert",
      "Student",
      student.studentId,
      "FR-041",
    );
    return { ...student };
  }

  getStudentForPerson(
    personId: string,
    institutionId: string,
  ): SyncedStudentRecord | undefined {
    const canonicalId = this.persons.resolveCanonicalPersonId(personId);
    const entry = [...this.students.values()].find(
      (record) =>
        this.persons.resolveCanonicalPersonId(record.personId) ===
          canonicalId && record.institutionId === institutionId,
    );
    return entry ? { ...entry } : undefined;
  }
}
