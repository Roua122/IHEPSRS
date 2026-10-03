import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import {
  PersonRecord,
  ResearcherProfile,
  ExternalIdMappingRecord,
  IdentityMergeDto,
  IdentityMergeResult,
} from "@ihepsrs/contracts";
import { writeStructuredLog } from "../../common/observability/structured-log";
import { createHash } from "node:crypto";

@Injectable()
export class PersonIdentityService {
  private persons = new Map<string, PersonRecord>();
  private researchers = new Map<string, ResearcherProfile>();
  private externalMappings = new Map<string, ExternalIdMappingRecord>();
  private mergeAuditLogs: Array<{
    auditId: string;
    sourcePersonId: string;
    targetPersonId: string;
    stewardUserId: string;
    reason: string;
    mergedAt: string;
    remappedRecordsCount: number;
  }> = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed Person 1
    const person1: PersonRecord = {
      personId: "P-101",
      nationalIdentifier: "HMAC_NAT_1010101", // Masked/Encrypted
      fullNameAr: "سمية خالد الأحمد",
      fullNameEn: "Sumaya Khaled Al-Ahmad",
      birthDate: "1988-04-12",
      email: "sumaya.khaled@university.edu",
      mobile: "+966500000001",
      status: "Active",
    };
    this.persons.set(person1.personId, person1);

    // Seed Researcher 1
    const researcher1: ResearcherProfile = {
      researcherId: "RES-101",
      personId: "P-101",
      institutionId: "INST-001",
      orcid: "0000-0002-1825-0097",
      specializationCode: "CS-AI-01",
      academicTitle: "Associate Professor",
      department: "Computer Science",
      scopusId: "SCOPUS-572001",
      googleScholarId: "GS-SUMAYA1",
      status: "Active",
    };
    this.researchers.set(researcher1.researcherId, researcher1);

    // Seed Person 3 & Researcher 2 (For Reviewer Assignment tests)
    const person3: PersonRecord = {
      personId: "P-103",
      nationalIdentifier: "HMAC_NAT_2020202",
      fullNameAr: "د. خالد منصور",
      fullNameEn: "Dr. Khaled Mansour",
      status: "Active",
    };
    this.persons.set(person3.personId, person3);

    const researcher2: ResearcherProfile = {
      researcherId: "RES-102",
      personId: "P-103",
      institutionId: "INST-001",
      orcid: "0000-0003-9999-1111",
      specializationCode: "CS-SE-02",
      academicTitle: "Professor",
      department: "Software Engineering",
      status: "Active",
    };
    this.researchers.set(researcher2.researcherId, researcher2);

    // Seed Person 2 (Duplicate to demonstrate FR-042 / BR-055 merge)
    const person2: PersonRecord = {
      personId: "P-102",
      nationalIdentifier: "HMAC_NAT_1010101", // Matching national fingerprint
      fullNameAr: "سمية خالد أ.",
      fullNameEn: "Sumaya K. Al-Ahmad",
      birthDate: "1988-04-12",
      email: "sumaya.alt@gmail.com",
      status: "Active",
    };
    this.persons.set(person2.personId, person2);

    const mapping1: ExternalIdMappingRecord = {
      mappingId: "MAP-001",
      sourceSystem: "MOCK_UNIVERSITY_SIS",
      entityType: "Person",
      externalId: "EXT-EMP-9901",
      canonicalId: "P-101",
      effectiveFrom: "2024-01-01T00:00:00Z",
      status: "Active",
    };
    this.externalMappings.set(mapping1.mappingId, mapping1);

    const mapping2: ExternalIdMappingRecord = {
      mappingId: "MAP-002",
      sourceSystem: "EXTERNAL_GRANT_SYS",
      entityType: "Person",
      externalId: "EXT-EMP-9902",
      canonicalId: "P-102",
      effectiveFrom: "2024-06-01T00:00:00Z",
      status: "Active",
    };
    this.externalMappings.set(mapping2.mappingId, mapping2);
  }

  // --- FR-021: Researcher Profile Management ---
  createOrUpdateResearcher(profile: Partial<ResearcherProfile> & { personId: string; institutionId: string }): ResearcherProfile {
    const person = this.persons.get(profile.personId);
    if (!person) {
      throw new NotFoundException(`Person with ID ${profile.personId} not found`);
    }

    const existing = Array.from(this.researchers.values()).find((r) => r.personId === profile.personId);
    const researcherId = profile.researcherId || existing?.researcherId || `RES-${Date.now()}`;

    const updated: ResearcherProfile = {
      researcherId,
      personId: profile.personId,
      institutionId: profile.institutionId,
      orcid: profile.orcid || existing?.orcid,
      specializationCode: profile.specializationCode || existing?.specializationCode,
      academicTitle: profile.academicTitle || existing?.academicTitle,
      department: profile.department || existing?.department,
      scopusId: profile.scopusId || existing?.scopusId,
      googleScholarId: profile.googleScholarId || existing?.googleScholarId,
      status: profile.status || existing?.status || "Active",
    };

    this.researchers.set(researcherId, updated);
    writeStructuredLog({
      level: "info",
      event: "researcher.profile.saved",
      message: `Researcher profile ${researcherId} saved for person ${profile.personId}`,
      researcherId,
      personId: profile.personId,
    });

    return updated;
  }

  getResearcher(researcherId: string): ResearcherProfile {
    const researcher = this.researchers.get(researcherId);
    if (!researcher) {
      throw new NotFoundException(`Researcher ${researcherId} not found`);
    }
    return researcher;
  }

  getResearcherByPersonId(personId: string): ResearcherProfile | undefined {
    return Array.from(this.researchers.values()).find((r) => r.personId === personId);
  }

  getAllResearchers(): ResearcherProfile[] {
    return Array.from(this.researchers.values());
  }

  getPerson(personId: string): PersonRecord {
    const person = this.persons.get(personId);
    if (!person) {
      throw new NotFoundException(`Person ${personId} not found`);
    }
    return this.maskSensitiveFields(person);
  }

  getAllPersons(): PersonRecord[] {
    return Array.from(this.persons.values()).map((p) => this.maskSensitiveFields(p));
  }

  // --- NFR-025: Data Minimization & Sensitive Data Masking ---
  private maskSensitiveFields(person: PersonRecord): PersonRecord {
    if (!person.nationalIdentifier) return person;
    const national = person.nationalIdentifier;
    const masked = national.length > 6 ? `${national.slice(0, 3)}***${national.slice(-3)}` : "***";
    return {
      ...person,
      nationalIdentifier: masked,
    };
  }

  // --- FR-042 & BR-055: Identity Resolution & Duplicate Person Merge ---
  findMatchingPersons(query: { nationalIdentifier?: string; email?: string; birthDate?: string }): PersonRecord[] {
    return Array.from(this.persons.values())
      .filter((p) => p.status === "Active")
      .filter((p) => {
        if (query.nationalIdentifier && p.nationalIdentifier === query.nationalIdentifier) return true;
        if (query.email && p.email?.toLowerCase() === query.email.toLowerCase()) return true;
        if (query.birthDate && p.birthDate === query.birthDate) return true;
        return false;
      })
      .map((p) => this.maskSensitiveFields(p));
  }

  mergePersonIdentities(dto: IdentityMergeDto): IdentityMergeResult {
    const sourcePerson = this.persons.get(dto.sourcePersonId);
    const targetPerson = this.persons.get(dto.targetPersonId);

    if (!sourcePerson) {
      throw new NotFoundException(`Source Person ${dto.sourcePersonId} not found`);
    }
    if (!targetPerson) {
      throw new NotFoundException(`Target Person ${dto.targetPersonId} not found`);
    }
    if (sourcePerson.personId === targetPerson.personId) {
      throw new BadRequestException("Cannot merge a person into themselves");
    }
    if (sourcePerson.status === "Archived") {
      throw new BadRequestException("Source person is already merged or archived");
    }

    let remappedCount = 0;

    // 1. Remap External ID Mappings from source to target (BR-055)
    for (const [id, mapping] of this.externalMappings.entries()) {
      if (mapping.canonicalId === dto.sourcePersonId) {
        this.externalMappings.set(id, {
          ...mapping,
          canonicalId: dto.targetPersonId,
          status: "Merged",
        });
        remappedCount++;
      }
    }

    // 2. Remap Researcher Profiles if any
    for (const [rId, res] of this.researchers.entries()) {
      if (res.personId === dto.sourcePersonId) {
        this.researchers.set(rId, {
          ...res,
          personId: dto.targetPersonId,
        });
        remappedCount++;
      }
    }

    // 3. Update Source Person status to Archived (BR-055: Person root identity preserved, duplicate marked archived)
    this.persons.set(dto.sourcePersonId, {
      ...sourcePerson,
      status: "Archived",
    });

    const auditId = `AUD-MERGE-${Date.now()}`;
    const auditRecord = {
      auditId,
      sourcePersonId: dto.sourcePersonId,
      targetPersonId: dto.targetPersonId,
      stewardUserId: dto.stewardUserId,
      reason: dto.reason,
      mergedAt: new Date().toISOString(),
      remappedRecordsCount: remappedCount,
    };
    this.mergeAuditLogs.push(auditRecord);

    writeStructuredLog({
      level: "info",
      event: "identity.merge.executed",
      message: `Data Steward ${dto.stewardUserId} merged person ${dto.sourcePersonId} into ${dto.targetPersonId}`,
      sourcePersonId: dto.sourcePersonId,
      targetPersonId: dto.targetPersonId,
      stewardUserId: dto.stewardUserId,
      auditId,
      remappedCount,
    });

    return {
      mergedTargetPersonId: dto.targetPersonId,
      sourcePersonId: dto.sourcePersonId,
      remappedRecordsCount: remappedCount,
      auditId,
      mergedAt: auditRecord.mergedAt,
    };
  }

  getMergeAuditLogs() {
    return this.mergeAuditLogs;
  }
}
