import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  ExternalIdMappingRecord,
  IdentityMergeDto,
  IdentityMergeResult,
  IdentityUnmergeDto,
  PersonRecord,
  ResearcherProfile,
} from "@ihepsrs/contracts";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { writeStructuredLog } from "../../common/observability/structured-log";

interface IdentityMergeAuditRecord {
  auditId: string;
  sourcePersonId: string;
  targetPersonId: string;
  stewardUserId: string;
  reason: string;
  mergedAt: string;
  remappedRecordsCount: number;
  sourceStatusBefore: PersonRecord["status"];
  mappingSnapshots: Array<{
    mappingId: string;
    canonicalId: string;
    status: ExternalIdMappingRecord["status"];
  }>;
  researcherSnapshots: Array<{
    researcherId: string;
    personId: string;
  }>;
  reversedAt?: string;
  reversedByUserId?: string;
  reverseReason?: string;
}

interface PersonMatchQuery {
  nationalIdentifierFingerprint?: string;
  sourceSystem?: string;
  externalId?: string;
  email?: string;
  birthDate?: string;
}

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
}

function normalizeOrcid(value: string): string {
  return value.trim().toUpperCase();
}

@Injectable()
export class PersonIdentityService {
  private readonly persons = new Map<string, PersonRecord>();
  private readonly researchers = new Map<string, ResearcherProfile>();
  private readonly externalMappings = new Map<
    string,
    ExternalIdMappingRecord
  >();
  private readonly verifiedOrcidOwners = new Map<string, string>();
  private readonly mergeAuditLogs: IdentityMergeAuditRecord[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const person1: PersonRecord = {
      personId: "P-101",
      // Prototype stores only an opaque HMAC-like fingerprint, never a raw national identifier.
      nationalIdentifier: "HMAC_NAT_1010101",
      fullNameAr: "سمية خالد الأحمد",
      fullNameEn: "Sumaya Khaled Al-Ahmad",
      birthDate: "1988-04-12",
      email: "sumaya.khaled@university.edu",
      mobile: "+966500000001",
      status: "Active",
    };
    this.persons.set(person1.personId, person1);

    const researcher1: ResearcherProfile = {
      researcherId: "RES-101",
      personId: "P-101",
      institutionId: "INST-001",
      orcid: "0000-0002-1825-0097",
      specializationCode: "CS-AI-01",
      status: "Active",
    };
    this.researchers.set(researcher1.researcherId, researcher1);
    this.verifiedOrcidOwners.set(
      normalizeOrcid(researcher1.orcid!),
      researcher1.researcherId,
    );

    const person3: PersonRecord = {
      personId: "P-103",
      nationalIdentifier: "HMAC_NAT_2020202",
      fullNameAr: "د. خالد منصور",
      fullNameEn: "Dr. Khaled Mansour",
      birthDate: "1980-08-01",
      email: "khaled.mansour@university.edu",
      status: "Active",
    };
    this.persons.set(person3.personId, person3);

    const researcher2: ResearcherProfile = {
      researcherId: "RES-102",
      personId: "P-103",
      institutionId: "INST-001",
      orcid: "0000-0003-9999-1111",
      specializationCode: "CS-SE-02",
      status: "Active",
    };
    this.researchers.set(researcher2.researcherId, researcher2);
    this.verifiedOrcidOwners.set(
      normalizeOrcid(researcher2.orcid!),
      researcher2.researcherId,
    );

    const person2: PersonRecord = {
      personId: "P-102",
      nationalIdentifier: "HMAC_NAT_1010101",
      fullNameAr: "سمية خالد أ.",
      fullNameEn: "Sumaya K. Al-Ahmad",
      birthDate: "1988-04-12",
      email: "sumaya.alt@gmail.com",
      status: "Active",
    };
    this.persons.set(person2.personId, person2);

    this.externalMappings.set("MAP-001", {
      mappingId: "MAP-001",
      sourceSystem: "MOCK_UNIVERSITY_SIS",
      entityType: "Person",
      externalId: "EXT-EMP-9901",
      canonicalId: "P-101",
      effectiveFrom: "2024-01-01T00:00:00Z",
      status: "Active",
    });
    this.externalMappings.set("MAP-002", {
      mappingId: "MAP-002",
      sourceSystem: "EXTERNAL_GRANT_SYS",
      entityType: "Person",
      externalId: "EXT-EMP-9902",
      canonicalId: "P-102",
      effectiveFrom: "2024-06-01T00:00:00Z",
      status: "Active",
    });
  }

  createOrUpdateResearcher(
    profile: Partial<ResearcherProfile> & {
      personId: string;
      institutionId: string;
    },
  ): ResearcherProfile {
    const person = this.persons.get(profile.personId);
    if (!person || person.status !== "Active") {
      throw this.notFound(`Active Person ${profile.personId} not found`);
    }
    if (!profile.institutionId?.trim()) {
      throw this.validation("Researcher institutionId is required");
    }

    const existing = this.getResearcherByPersonId(profile.personId);
    const researcherId =
      profile.researcherId?.trim() || existing?.researcherId || randomUUID();
    const updated: ResearcherProfile = {
      researcherId,
      personId: profile.personId,
      institutionId: profile.institutionId.trim(),
      orcid: profile.orcid?.trim() || existing?.orcid,
      specializationCode:
        profile.specializationCode?.trim() || existing?.specializationCode,
      status: profile.status ?? existing?.status ?? "Active",
    };

    this.researchers.set(researcherId, updated);
    writeStructuredLog({
      level: "info",
      event: "researcher.profile.saved",
      researcherId,
      personId: profile.personId,
      institutionId: updated.institutionId,
    });
    return { ...updated };
  }

  verifyResearcherOrcid(
    researcherId: string,
    orcid: string,
  ): ResearcherProfile {
    const researcher = this.getResearcher(researcherId);
    const normalized = normalizeOrcid(orcid);
    if (!/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/.test(normalized)) {
      throw this.validation("BR-025: ORCID format is invalid");
    }

    const existingOwner = this.verifiedOrcidOwners.get(normalized);
    if (existingOwner && existingOwner !== researcherId) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message: "BR-025: Verified ORCID is already linked to another person",
      });
    }

    if (researcher.orcid) {
      const previous = normalizeOrcid(researcher.orcid);
      if (this.verifiedOrcidOwners.get(previous) === researcherId) {
        this.verifiedOrcidOwners.delete(previous);
      }
    }
    this.verifiedOrcidOwners.set(normalized, researcherId);
    const updated = { ...researcher, orcid: normalized };
    this.researchers.set(researcherId, updated);
    return { ...updated };
  }

  getResearcher(researcherId: string): ResearcherProfile {
    const researcher = this.researchers.get(researcherId);
    if (!researcher) {
      throw this.notFound(`Researcher ${researcherId} not found`);
    }
    return { ...researcher };
  }

  getResearcherByPersonId(personId: string): ResearcherProfile | undefined {
    const found = Array.from(this.researchers.values()).find(
      (researcher) => researcher.personId === personId,
    );
    return found ? { ...found } : undefined;
  }

  getAllResearchers(): ResearcherProfile[] {
    return Array.from(this.researchers.values()).map((item) => ({ ...item }));
  }

  getPerson(personId: string): PersonRecord {
    const person = this.persons.get(personId);
    if (!person) throw this.notFound(`Person ${personId} not found`);
    return this.maskSensitiveFields(person);
  }

  getAllPersons(): PersonRecord[] {
    return Array.from(this.persons.values()).map((person) =>
      this.maskSensitiveFields(person),
    );
  }

  findMatchingPersons(query: PersonMatchQuery): PersonRecord[] {
    const fingerprint = query.nationalIdentifierFingerprint?.trim();
    const sourceSystem = normalize(query.sourceSystem);
    const externalId = query.externalId?.trim();
    const email = normalize(query.email);
    const birthDate = query.birthDate?.trim();

    const trustedPersonIds = new Set<string>();
    if (sourceSystem && externalId) {
      for (const mapping of this.externalMappings.values()) {
        if (
          mapping.entityType === "Person" &&
          normalize(mapping.sourceSystem) === sourceSystem &&
          mapping.externalId === externalId &&
          mapping.status === "Active"
        ) {
          trustedPersonIds.add(mapping.canonicalId);
        }
      }
    }

    return Array.from(this.persons.values())
      .filter((person) => person.status === "Active")
      .filter((person) => {
        if (fingerprint && person.nationalIdentifier === fingerprint)
          return true;
        if (trustedPersonIds.has(person.personId)) return true;
        // Email/date are supporting evidence only; neither one matches by itself.
        return Boolean(
          email &&
          birthDate &&
          normalize(person.email) === email &&
          person.birthDate === birthDate,
        );
      })
      .map((person) => this.maskSensitiveFields(person));
  }

  mergePersonIdentities(
    dto: IdentityMergeDto,
    stewardUserId: string,
  ): IdentityMergeResult {
    if (!dto.reason?.trim()) {
      throw this.validation("FR-042: Identity merge reason is required");
    }
    const sourcePerson = this.persons.get(dto.sourcePersonId);
    const targetPerson = this.persons.get(dto.targetPersonId);
    if (!sourcePerson)
      throw this.notFound(`Source Person ${dto.sourcePersonId} not found`);
    if (!targetPerson)
      throw this.notFound(`Target Person ${dto.targetPersonId} not found`);
    if (sourcePerson.personId === targetPerson.personId) {
      throw this.validation("Cannot merge a person into themselves");
    }
    if (sourcePerson.status !== "Active" || targetPerson.status !== "Active") {
      throw this.validation(
        "Both source and target Person records must be Active",
      );
    }

    const mappingSnapshots = Array.from(this.externalMappings.values())
      .filter((mapping) => mapping.canonicalId === dto.sourcePersonId)
      .map((mapping) => ({
        mappingId: mapping.mappingId,
        canonicalId: mapping.canonicalId,
        status: mapping.status,
      }));
    const researcherSnapshots = Array.from(this.researchers.values())
      .filter((researcher) => researcher.personId === dto.sourcePersonId)
      .map((researcher) => ({
        researcherId: researcher.researcherId,
        personId: researcher.personId,
      }));

    for (const snapshot of mappingSnapshots) {
      const mapping = this.externalMappings.get(snapshot.mappingId)!;
      this.externalMappings.set(snapshot.mappingId, {
        ...mapping,
        canonicalId: dto.targetPersonId,
        status: "Merged",
      });
    }
    for (const snapshot of researcherSnapshots) {
      const researcher = this.researchers.get(snapshot.researcherId)!;
      this.researchers.set(snapshot.researcherId, {
        ...researcher,
        personId: dto.targetPersonId,
      });
    }
    this.persons.set(dto.sourcePersonId, {
      ...sourcePerson,
      status: "Archived",
    });

    const audit: IdentityMergeAuditRecord = {
      auditId: randomUUID(),
      sourcePersonId: dto.sourcePersonId,
      targetPersonId: dto.targetPersonId,
      stewardUserId,
      reason: dto.reason.trim(),
      mergedAt: new Date().toISOString(),
      remappedRecordsCount:
        mappingSnapshots.length + researcherSnapshots.length,
      sourceStatusBefore: sourcePerson.status,
      mappingSnapshots,
      researcherSnapshots,
    };
    this.mergeAuditLogs.push(audit);

    writeStructuredLog({
      level: "info",
      event: "identity.merge.executed",
      sourcePersonId: dto.sourcePersonId,
      targetPersonId: dto.targetPersonId,
      stewardUserId,
      auditId: audit.auditId,
      remappedCount: audit.remappedRecordsCount,
    });

    return {
      mergedTargetPersonId: dto.targetPersonId,
      sourcePersonId: dto.sourcePersonId,
      remappedRecordsCount: audit.remappedRecordsCount,
      auditId: audit.auditId,
      mergedAt: audit.mergedAt,
    };
  }

  unmergePersonIdentities(
    dto: IdentityUnmergeDto,
    stewardUserId: string,
  ): void {
    if (!dto.reason?.trim()) {
      throw this.validation("FR-042: Identity unmerge reason is required");
    }
    const audit = this.mergeAuditLogs.find(
      (entry) => entry.auditId === dto.auditId,
    );
    if (!audit)
      throw this.notFound(`Identity merge audit ${dto.auditId} not found`);
    if (audit.reversedAt) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message: "Identity merge was already reversed",
      });
    }

    for (const snapshot of audit.mappingSnapshots) {
      const current = this.externalMappings.get(snapshot.mappingId);
      if (current) {
        this.externalMappings.set(snapshot.mappingId, {
          ...current,
          canonicalId: snapshot.canonicalId,
          status: snapshot.status,
        });
      }
    }
    for (const snapshot of audit.researcherSnapshots) {
      const current = this.researchers.get(snapshot.researcherId);
      if (current) {
        this.researchers.set(snapshot.researcherId, {
          ...current,
          personId: snapshot.personId,
        });
      }
    }
    const source = this.persons.get(audit.sourcePersonId);
    if (source) {
      this.persons.set(audit.sourcePersonId, {
        ...source,
        status: audit.sourceStatusBefore,
      });
    }

    audit.reversedAt = new Date().toISOString();
    audit.reversedByUserId = stewardUserId;
    audit.reverseReason = dto.reason.trim();
    writeStructuredLog({
      level: "info",
      event: "identity.merge.reversed",
      auditId: audit.auditId,
      sourcePersonId: audit.sourcePersonId,
      targetPersonId: audit.targetPersonId,
      stewardUserId,
    });
  }

  getMergeAuditLogs(): readonly IdentityMergeAuditRecord[] {
    return this.mergeAuditLogs.map((entry) => ({
      ...entry,
      mappingSnapshots: entry.mappingSnapshots.map((item) => ({ ...item })),
      researcherSnapshots: entry.researcherSnapshots.map((item) => ({
        ...item,
      })),
    }));
  }

  private maskSensitiveFields(person: PersonRecord): PersonRecord {
    if (!person.nationalIdentifier) return { ...person };
    const value = person.nationalIdentifier;
    return {
      ...person,
      nationalIdentifier:
        value.length > 6 ? `${value.slice(0, 3)}***${value.slice(-3)}` : "***",
    };
  }

  private validation(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }

  private notFound(message: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message,
    });
  }
}
