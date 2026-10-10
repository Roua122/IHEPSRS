import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrototypeAuditService } from "../common/audit/prototype-audit.service";
import { AppException } from "../common/errors/app-exception";
import { ErrorCode } from "../common/errors/error-code";
import type { AuthorizationPrincipal } from "../identity/authorization/authorization.types";
import { InstitutionAuthorizationService } from "./institution-authorization.service";
import type {
  ChangeInstitutionStatusDto,
  CreateAcademicProgramDto,
  CreateInstitutionDto,
  CreateOrgUnitDto,
  CreatePolicyVersionDto,
  CreateReferenceVersionDto,
  UpdateInstitutionDto,
} from "./institutions.dto";

export interface Institution {
  institutionId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  type: string;
  status: "Active" | "Inactive" | "Archived";
  externalRefs?: Record<string, string>;
}

export interface OrgUnit {
  orgUnitId: string;
  institutionId: string;
  parentOrgUnitId?: string;
  type: string;
  nameAr: string;
  status: "Active" | "Inactive" | "Archived";
  effectiveFrom: string;
  effectiveTo?: string;
}

export type AcademicProgramStatus =
  "Draft" | "Active" | "Suspended" | "Retired" | "Archived";

export interface AcademicProgram {
  programId: string;
  institutionId: string;
  orgUnitId: string;
  degreeLevel: "Diploma" | "Master" | "PhD";
  nameAr: string;
  specializationCode?: string;
  status: AcademicProgramStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  thesisRequired: boolean;
  versionNo: number;
}

export interface ReferenceValueVersion {
  referenceType: string;
  code: string;
  label: string;
  versionNo: number;
  effectiveFrom: string;
  effectiveTo?: string;
  retired: boolean;
}

export interface PolicyConfiguration {
  policyId: string;
  policyKey: string;
  scopeType: "Central" | "Institution" | "Program" | "Cohort";
  scopeId: string;
  value: unknown;
  versionNo: number;
  effectiveFrom: string;
  effectiveTo?: string;
  approvedByUserId: string;
  status: "Draft" | "Approved" | "Retired";
}

@Injectable()
export class InstitutionsService {
  private readonly institutions = new Map<string, Institution>();
  private readonly orgUnits = new Map<string, OrgUnit>();
  private readonly programs = new Map<string, AcademicProgram[]>();
  private readonly retiredInstitutionIds = new Set<string>();
  private readonly referenceValues = new Map<string, ReferenceValueVersion[]>();
  private readonly policies = new Map<string, PolicyConfiguration[]>();

  constructor(
    private readonly authorization: InstitutionAuthorizationService,
    private readonly audit: PrototypeAuditService,
  ) {}

  listInstitutions(principal: AuthorizationPrincipal): Institution[] {
    const central = this.authorization.canManageCentralRegistry(principal);
    return [...this.institutions.values()]
      .filter(
        (institution) =>
          central ||
          this.authorization.canManageInstitution(
            principal,
            institution.institutionId,
          ),
      )
      .map((institution) => this.cloneInstitution(institution));
  }

  getInstitution(
    institutionId: string,
    principal: AuthorizationPrincipal,
  ): Institution {
    const institution = this.requireInstitution(institutionId);
    if (!this.authorization.canManageCentralRegistry(principal)) {
      this.authorization.assertInstitutionMasterData(principal, institutionId);
    }
    return this.cloneInstitution(institution);
  }

  createInstitution(
    dto: CreateInstitutionDto,
    principal: AuthorizationPrincipal,
  ): Institution {
    this.authorization.assertCentralRegistry(principal);
    return this.transact(() => {
      const institutionId = dto.institutionId.trim();
      const code = dto.code.trim();
      if (
        this.retiredInstitutionIds.has(institutionId) ||
        this.institutions.has(institutionId)
      ) {
        throw this.conflict("BR-001: institutionId cannot be reused");
      }
      this.assertActiveInstitutionCodeUnique(code);

      const record: Institution = {
        institutionId,
        code,
        nameAr: dto.nameAr.trim(),
        nameEn: dto.nameEn?.trim() || undefined,
        type: dto.type.trim(),
        status: dto.status,
        externalRefs: dto.externalRefs ? { ...dto.externalRefs } : undefined,
      };
      this.institutions.set(institutionId, record);
      this.record(
        principal,
        "institution.created",
        "Institution",
        institutionId,
        "FR-004/BR-001/BR-033/NFR-007",
      );
      return this.cloneInstitution(record);
    });
  }

  updateInstitution(
    institutionId: string,
    dto: UpdateInstitutionDto,
    principal: AuthorizationPrincipal,
  ): Institution {
    this.authorization.assertInstitutionMasterData(principal, institutionId);
    return this.transact(() => {
      const existing = this.requireInstitution(institutionId);
      if (existing.status === "Archived") {
        throw this.conflict("Archived Institution master data is immutable");
      }
      const code = dto.code?.trim() ?? existing.code;
      if (code !== existing.code) this.assertActiveInstitutionCodeUnique(code);
      const updated: Institution = {
        ...existing,
        code,
        nameAr: dto.nameAr?.trim() ?? existing.nameAr,
        nameEn:
          dto.nameEn === undefined
            ? existing.nameEn
            : dto.nameEn.trim() || undefined,
        type: dto.type?.trim() ?? existing.type,
        externalRefs:
          dto.externalRefs === undefined
            ? existing.externalRefs
              ? { ...existing.externalRefs }
              : undefined
            : { ...dto.externalRefs },
      };
      this.institutions.set(institutionId, updated);
      this.record(
        principal,
        "institution.master_data.updated",
        "Institution",
        institutionId,
        "FR-004/BR-033",
      );
      return this.cloneInstitution(updated);
    });
  }

  changeInstitutionStatus(
    institutionId: string,
    dto: ChangeInstitutionStatusDto,
    principal: AuthorizationPrincipal,
  ): Institution {
    this.authorization.assertInstitutionMasterData(principal, institutionId);
    return this.transact(() => {
      const existing = this.requireInstitution(institutionId);
      if (existing.status === "Archived") {
        throw this.conflict(
          "BR-001: Archived Institution cannot be reactivated",
        );
      }
      const updated: Institution = { ...existing, status: dto.status };
      this.institutions.set(institutionId, updated);
      this.record(
        principal,
        "institution.status.changed",
        "Institution",
        institutionId,
        "FR-004/BR-033",
      );
      return this.cloneInstitution(updated);
    });
  }

  archiveInstitution(
    institutionId: string,
    principal: AuthorizationPrincipal,
  ): Institution {
    this.authorization.assertCentralRegistry(principal);
    return this.transact(() => {
      const existing = this.requireInstitution(institutionId);
      const updated: Institution = { ...existing, status: "Archived" };
      this.institutions.set(institutionId, updated);
      this.retiredInstitutionIds.add(institutionId);
      this.record(
        principal,
        "institution.archived",
        "Institution",
        institutionId,
        "BR-001/BR-033",
      );
      return this.cloneInstitution(updated);
    });
  }

  listOrgUnits(
    institutionId: string,
    principal: AuthorizationPrincipal,
  ): OrgUnit[] {
    this.authorization.assertInstitutionMasterData(principal, institutionId);
    return [...this.orgUnits.values()]
      .filter((unit) => unit.institutionId === institutionId)
      .map((unit) => ({ ...unit }));
  }

  createOrgUnit(
    institutionId: string,
    dto: CreateOrgUnitDto,
    principal: AuthorizationPrincipal,
  ): OrgUnit {
    this.authorization.assertInstitutionMasterData(principal, institutionId);
    return this.transact(() => {
      this.assertWindow(dto.effectiveFrom, dto.effectiveTo);
      if (this.orgUnits.has(dto.orgUnitId)) {
        throw this.conflict("Duplicate orgUnitId");
      }
      const institution = this.requireInstitution(institutionId);
      if (institution.status !== "Active") {
        throw this.validation("BR-002: OrgUnit requires an Active Institution");
      }

      if (dto.parentOrgUnitId) {
        if (dto.parentOrgUnitId === dto.orgUnitId) {
          throw this.validation("OrgUnit cannot be its own parent");
        }
        const parent = this.orgUnits.get(dto.parentOrgUnitId);
        if (!parent || parent.institutionId !== institutionId) {
          throw this.validation(
            "BR-002: Parent OrgUnit must belong to the same Institution",
          );
        }
        if (parent.status !== "Active") {
          throw this.validation("BR-002: Parent OrgUnit must be Active");
        }
        this.assertWindowContained(
          dto.effectiveFrom,
          dto.effectiveTo,
          parent.effectiveFrom,
          parent.effectiveTo,
          "BR-002/BR-042: OrgUnit effective window must fit the parent OrgUnit",
        );
      }

      const record: OrgUnit = {
        orgUnitId: dto.orgUnitId.trim(),
        institutionId,
        parentOrgUnitId: dto.parentOrgUnitId?.trim() || undefined,
        type: dto.type.trim(),
        nameAr: dto.nameAr.trim(),
        status: dto.status,
        effectiveFrom: this.dateOnly(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo
          ? this.dateOnly(dto.effectiveTo)
          : undefined,
      };
      this.orgUnits.set(record.orgUnitId, record);
      this.record(
        principal,
        "org_unit.created",
        "OrgUnit",
        record.orgUnitId,
        "FR-005/BR-002/BR-042",
      );
      return { ...record };
    });
  }

  listPrograms(
    institutionId: string,
    principal: AuthorizationPrincipal,
  ): AcademicProgram[] {
    this.authorization.assertInstitutionMasterData(principal, institutionId);
    return [...this.programs.values()]
      .map((versions) => versions.at(-1))
      .filter(
        (program): program is AcademicProgram =>
          Boolean(program) && program!.institutionId === institutionId,
      )
      .map((program) => ({ ...program }));
  }

  listProgramVersions(
    programId: string,
    principal: AuthorizationPrincipal,
  ): AcademicProgram[] {
    const versions = this.requireProgramVersions(programId);
    this.authorization.assertInstitutionMasterData(
      principal,
      versions[0].institutionId,
    );
    return versions.map((version) => ({ ...version }));
  }

  createProgramVersion(
    institutionId: string,
    dto: CreateAcademicProgramDto,
    principal: AuthorizationPrincipal,
  ): AcademicProgram {
    this.authorization.assertInstitutionMasterData(principal, institutionId);
    return this.transact(() => {
      this.assertWindow(dto.effectiveFrom, dto.effectiveTo);
      const institution = this.requireInstitution(institutionId);
      if (institution.status !== "Active") {
        throw this.validation(
          "BR-002: AcademicProgram requires an Active Institution",
        );
      }
      const unit = this.orgUnits.get(dto.orgUnitId);
      if (
        !unit ||
        unit.institutionId !== institutionId ||
        unit.status !== "Active"
      ) {
        throw this.validation(
          "BR-002: AcademicProgram requires a valid Active OrgUnit",
        );
      }
      this.assertWindowContained(
        dto.effectiveFrom,
        dto.effectiveTo,
        unit.effectiveFrom,
        unit.effectiveTo,
        "BR-002/BR-042: AcademicProgram effective window must fit its OrgUnit",
      );

      const existing = this.programs.get(dto.programId) ?? [];
      const expectedVersion =
        existing.length === 0
          ? 1
          : Math.max(...existing.map((v) => v.versionNo)) + 1;
      if (dto.versionNo !== expectedVersion) {
        throw this.conflict(
          `BR-062: Expected AcademicProgram versionNo ${expectedVersion}`,
        );
      }
      const latest = [...existing].sort((a, b) => b.versionNo - a.versionNo)[0];
      if (
        latest &&
        this.time(dto.effectiveFrom) <= this.time(latest.effectiveFrom)
      ) {
        throw this.conflict(
          "BR-042: New AcademicProgram version must start after the previous version",
        );
      }

      if (
        latest?.status === "Active" &&
        dto.status === "Active" &&
        !latest.effectiveTo
      ) {
        latest.effectiveTo = this.dateOnly(dto.effectiveFrom);
      } else if (
        latest?.status === "Active" &&
        dto.status === "Active" &&
        latest.effectiveTo &&
        this.time(dto.effectiveFrom) < this.time(latest.effectiveTo)
      ) {
        throw this.conflict("BR-042: AcademicProgram versions cannot overlap");
      }

      const record: AcademicProgram = {
        programId: dto.programId.trim(),
        institutionId,
        orgUnitId: dto.orgUnitId.trim(),
        degreeLevel: dto.degreeLevel,
        nameAr: dto.nameAr.trim(),
        specializationCode: dto.specializationCode?.trim() || undefined,
        status: dto.status,
        effectiveFrom: this.dateOnly(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo
          ? this.dateOnly(dto.effectiveTo)
          : undefined,
        thesisRequired: dto.thesisRequired,
        versionNo: dto.versionNo,
      };
      const versions = [...existing, record].sort(
        (a, b) => a.versionNo - b.versionNo,
      );
      this.programs.set(record.programId, versions);
      this.record(
        principal,
        "academic_program.version.created",
        "AcademicProgram",
        `${record.programId}:v${record.versionNo}`,
        "FR-006/BR-042/BR-062",
      );
      return { ...record };
    });
  }

  assertProgramEligible(
    programId: string,
    enrollmentDate: string,
    principal?: AuthorizationPrincipal,
  ): AcademicProgram {
    const program = this.resolveProgramAt(programId, enrollmentDate);
    if (!program || program.status !== "Active") {
      throw this.validation(
        "BR-003: Program is not Active/effective at enrollment date",
      );
    }
    if (principal) {
      this.authorization.assertInstitutionMasterData(
        principal,
        program.institutionId,
      );
    }
    const institution = this.requireInstitution(program.institutionId);
    if (institution.status !== "Active") {
      throw this.validation("BR-003: Program Institution is not Active");
    }
    const unit = this.orgUnits.get(program.orgUnitId);
    if (
      !unit ||
      unit.status !== "Active" ||
      !this.isEffective(unit.effectiveFrom, unit.effectiveTo, enrollmentDate)
    ) {
      throw this.validation(
        "BR-042: Program OrgUnit is not effective at enrollment date",
      );
    }
    return { ...program };
  }

  createReferenceVersion(
    dto: CreateReferenceVersionDto,
    principal: AuthorizationPrincipal,
  ): ReferenceValueVersion {
    this.authorization.assertReferenceCentral(principal);
    return this.transact(() => {
      this.assertWindow(dto.effectiveFrom, dto.effectiveTo);
      const key = this.referenceKey(dto.referenceType, dto.code);
      const versions = this.referenceValues.get(key) ?? [];
      const expectedVersion =
        versions.length === 0
          ? 1
          : Math.max(...versions.map((v) => v.versionNo)) + 1;
      if (dto.versionNo !== expectedVersion) {
        throw this.conflict(
          `BR-062: Expected reference versionNo ${expectedVersion}`,
        );
      }
      const latest = [...versions].sort((a, b) => b.versionNo - a.versionNo)[0];
      if (
        latest &&
        this.time(dto.effectiveFrom) <= this.time(latest.effectiveFrom)
      ) {
        throw this.conflict(
          "BR-038/BR-062: Reference versions must move forward in time",
        );
      }
      if (latest && !latest.effectiveTo)
        latest.effectiveTo = this.dateOnly(dto.effectiveFrom);
      if (
        latest?.effectiveTo &&
        this.time(dto.effectiveFrom) < this.time(latest.effectiveTo)
      ) {
        throw this.conflict(
          "BR-062: Reference effective windows cannot overlap",
        );
      }

      const record: ReferenceValueVersion = {
        referenceType: dto.referenceType.trim(),
        code: dto.code.trim(),
        label: dto.label.trim(),
        versionNo: dto.versionNo,
        effectiveFrom: this.dateOnly(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo
          ? this.dateOnly(dto.effectiveTo)
          : undefined,
        retired: false,
      };
      this.referenceValues.set(key, [...versions, record]);
      this.record(
        principal,
        "reference.version.created",
        "ReferenceValue",
        `${key}:v${record.versionNo}`,
        "FR-007/FR-038/BR-038/BR-039/BR-062",
      );
      return { ...record };
    });
  }

  retireReference(
    referenceType: string,
    code: string,
    effectiveTo: string,
    principal: AuthorizationPrincipal,
  ): ReferenceValueVersion {
    this.authorization.assertReferenceCentral(principal);
    return this.transact(() => {
      const key = this.referenceKey(referenceType, code);
      const versions = this.referenceValues.get(key);
      if (!versions?.length) throw this.notFound("Reference value not found");
      const latest = [...versions].sort((a, b) => b.versionNo - a.versionNo)[0];
      if (latest.retired)
        throw this.conflict("Reference value is already retired");
      this.assertWindow(latest.effectiveFrom, effectiveTo);
      latest.effectiveTo = this.dateOnly(effectiveTo);
      latest.retired = true;
      this.record(
        principal,
        "reference.retired",
        "ReferenceValue",
        `${key}:v${latest.versionNo}`,
        "BR-039",
      );
      return { ...latest };
    });
  }

  listReferenceVersions(
    principal: AuthorizationPrincipal,
  ): ReferenceValueVersion[] {
    this.authorization.assertReferenceCentral(principal);
    return [...this.referenceValues.values()]
      .flat()
      .map((value) => ({ ...value }));
  }

  resolveReferenceAt(
    referenceType: string,
    code: string,
    at: string,
  ): ReferenceValueVersion | undefined {
    const versions =
      this.referenceValues.get(this.referenceKey(referenceType, code)) ?? [];
    const record = versions
      .filter((version) =>
        this.isEffective(version.effectiveFrom, version.effectiveTo, at),
      )
      .sort((a, b) => b.versionNo - a.versionNo)[0];
    return record ? { ...record } : undefined;
  }

  createPolicyVersion(
    dto: CreatePolicyVersionDto,
    principal: AuthorizationPrincipal,
  ): PolicyConfiguration {
    const institutionId = this.resolvePolicyInstitution(
      dto.scopeType,
      dto.scopeId,
    );
    this.authorization.assertPolicyScope(principal, {
      type: dto.scopeType,
      institutionId,
    });
    if (dto.approvedByUserId !== principal.userId) {
      throw this.validation(
        "approvedByUserId must match the authenticated actor",
      );
    }

    return this.transact(() => {
      this.assertWindow(dto.effectiveFrom, dto.effectiveTo);
      const key = this.policyKey(dto.policyKey, dto.scopeType, dto.scopeId);
      const versions = this.policies.get(key) ?? [];
      const expectedVersion =
        versions.length === 0
          ? 1
          : Math.max(...versions.map((v) => v.versionNo)) + 1;
      if (dto.versionNo !== expectedVersion) {
        throw this.conflict(
          `BR-062: Expected policy versionNo ${expectedVersion}`,
        );
      }
      const latest = [...versions].sort((a, b) => b.versionNo - a.versionNo)[0];
      if (
        latest &&
        this.time(dto.effectiveFrom) <= this.time(latest.effectiveFrom)
      ) {
        throw this.conflict(
          "BR-038/BR-062: Policy versions must move forward in time",
        );
      }
      if (dto.status === "Approved") {
        const latestApproved = [...versions]
          .filter(
            (version) =>
              version.status === "Approved" || version.status === "Retired",
          )
          .sort((a, b) => b.versionNo - a.versionNo)[0];
        if (latestApproved && !latestApproved.effectiveTo) {
          latestApproved.effectiveTo = dto.effectiveFrom;
        }
        if (
          latestApproved?.effectiveTo &&
          this.time(dto.effectiveFrom) < this.time(latestApproved.effectiveTo)
        ) {
          throw this.conflict(
            "BR-062: Approved policy effective windows cannot overlap",
          );
        }
      }

      const record: PolicyConfiguration = {
        policyId: randomUUID(),
        policyKey: dto.policyKey.trim(),
        scopeType: dto.scopeType,
        scopeId: dto.scopeId.trim(),
        value: structuredClone(dto.value),
        versionNo: dto.versionNo,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo,
        approvedByUserId: principal.userId,
        status: dto.status,
      };
      this.policies.set(key, [...versions, record]);
      this.record(
        principal,
        "policy.version.created",
        "PolicyConfiguration",
        record.policyId,
        "FR-043/BR-038/BR-062",
      );
      return this.clonePolicy(record);
    });
  }

  retirePolicy(
    policyId: string,
    effectiveTo: string,
    principal: AuthorizationPrincipal,
  ): PolicyConfiguration {
    const found = this.findPolicy(policyId);
    if (!found) throw this.notFound("PolicyConfiguration not found");
    const institutionId = this.resolvePolicyInstitution(
      found.record.scopeType,
      found.record.scopeId,
    );
    this.authorization.assertPolicyScope(principal, {
      type: found.record.scopeType,
      institutionId,
    });

    return this.transact(() => {
      const current = this.findPolicy(policyId);
      if (!current) throw this.notFound("PolicyConfiguration not found");
      if (current.record.status === "Retired") {
        throw this.conflict("PolicyConfiguration is already retired");
      }
      this.assertWindow(current.record.effectiveFrom, effectiveTo);
      current.record.effectiveTo = effectiveTo;
      current.record.status = "Retired";
      this.record(
        principal,
        "policy.retired",
        "PolicyConfiguration",
        policyId,
        "BR-038/BR-062",
      );
      return this.clonePolicy(current.record);
    });
  }

  listPolicies(principal: AuthorizationPrincipal): PolicyConfiguration[] {
    return [...this.policies.values()]
      .flat()
      .filter((policy) => {
        const institutionId = this.resolvePolicyInstitution(
          policy.scopeType,
          policy.scopeId,
        );
        if (policy.scopeType === "Central" || policy.scopeType === "Cohort") {
          return this.authorization.canManageCentralRegistry(principal);
        }
        return Boolean(
          institutionId &&
          this.authorization.canManageInstitution(principal, institutionId),
        );
      })
      .map((policy) => this.clonePolicy(policy));
  }

  resolvePolicyAt(
    policyKey: string,
    scopeType: PolicyConfiguration["scopeType"],
    scopeId: string,
    at: string,
  ): PolicyConfiguration | undefined {
    const versions =
      this.policies.get(this.policyKey(policyKey, scopeType, scopeId)) ?? [];
    const match = versions
      .filter(
        (version) =>
          (version.status === "Approved" || version.status === "Retired") &&
          this.isEffective(version.effectiveFrom, version.effectiveTo, at),
      )
      .sort((a, b) => b.versionNo - a.versionNo)[0];
    return match ? this.clonePolicy(match) : undefined;
  }

  listAudit(principal: AuthorizationPrincipal) {
    this.authorization.assertCentralRegistry(principal);
    return this.audit.list();
  }

  verifyAuditChain(): boolean {
    return this.audit.verifyChain();
  }

  private resolveProgramAt(
    programId: string,
    at: string,
  ): AcademicProgram | undefined {
    const versions = this.programs.get(programId) ?? [];
    return [...versions]
      .filter((version) =>
        this.isEffective(version.effectiveFrom, version.effectiveTo, at),
      )
      .sort((a, b) => b.versionNo - a.versionNo)[0];
  }

  private resolvePolicyInstitution(
    scopeType: PolicyConfiguration["scopeType"],
    scopeId: string,
  ): string | undefined {
    if (scopeType === "Institution") return scopeId;
    if (scopeType === "Program") {
      return this.programs.get(scopeId)?.at(-1)?.institutionId;
    }
    return undefined;
  }

  private findPolicy(
    policyId: string,
  ): { key: string; record: PolicyConfiguration } | undefined {
    for (const [key, versions] of this.policies.entries()) {
      const record = versions.find((version) => version.policyId === policyId);
      if (record) return { key, record };
    }
    return undefined;
  }

  private record(
    principal: AuthorizationPrincipal,
    action: string,
    entityType: string,
    entityId: string,
    sourceId: string,
  ): void {
    this.audit.append({
      actorUserId: principal.userId,
      action,
      entityType,
      entityId,
      metadata: { sourceId },
    });
  }

  private transact<T>(operation: () => T): T {
    const institutionSnapshot = structuredClone(this.institutions);
    const unitSnapshot = structuredClone(this.orgUnits);
    const programSnapshot = structuredClone(this.programs);
    const retiredSnapshot = structuredClone(this.retiredInstitutionIds);
    const referenceSnapshot = structuredClone(this.referenceValues);
    const policySnapshot = structuredClone(this.policies);
    const auditLength = this.audit.snapshotLength();
    try {
      return operation();
    } catch (error) {
      this.restoreMap(this.institutions, institutionSnapshot);
      this.restoreMap(this.orgUnits, unitSnapshot);
      this.restoreMap(this.programs, programSnapshot);
      this.restoreSet(this.retiredInstitutionIds, retiredSnapshot);
      this.restoreMap(this.referenceValues, referenceSnapshot);
      this.restoreMap(this.policies, policySnapshot);
      this.audit.rollbackTo(auditLength);
      throw error;
    }
  }

  private restoreMap<K, V>(target: Map<K, V>, snapshot: Map<K, V>): void {
    target.clear();
    for (const [key, value] of snapshot.entries()) target.set(key, value);
  }

  private restoreSet<T>(target: Set<T>, snapshot: Set<T>): void {
    target.clear();
    for (const value of snapshot.values()) target.add(value);
  }

  private assertActiveInstitutionCodeUnique(code: string): void {
    const normalized = code.toLowerCase();
    if (
      [...this.institutions.values()].some(
        (institution) =>
          institution.status !== "Archived" &&
          institution.code.toLowerCase() === normalized,
      )
    ) {
      throw this.conflict(
        "Institution code must be unique among non-archived Institutions",
      );
    }
  }

  private requireInstitution(institutionId: string): Institution {
    const institution = this.institutions.get(institutionId);
    if (!institution)
      throw this.notFound(`Institution ${institutionId} not found`);
    return institution;
  }

  private requireProgramVersions(programId: string): AcademicProgram[] {
    const versions = this.programs.get(programId);
    if (!versions?.length)
      throw this.notFound(`AcademicProgram ${programId} not found`);
    return versions;
  }

  private assertWindow(from: string, to?: string): void {
    const start = this.time(from);
    if (to && this.time(to) <= start) {
      throw this.validation("effectiveTo must be later than effectiveFrom");
    }
  }

  private assertWindowContained(
    from: string,
    to: string | undefined,
    parentFrom: string,
    parentTo: string | undefined,
    message: string,
  ): void {
    if (this.time(from) < this.time(parentFrom)) throw this.validation(message);
    if (parentTo && (!to || this.time(to) > this.time(parentTo))) {
      throw this.validation(message);
    }
  }

  private isEffective(
    from: string,
    to: string | undefined,
    at: string,
  ): boolean {
    const eventTime = this.time(at);
    return eventTime >= this.time(from) && (!to || eventTime < this.time(to));
  }

  private time(value: string): number {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp))
      throw this.validation("Invalid effective date/time");
    return timestamp;
  }

  private dateOnly(value: string): string {
    const timestamp = this.time(value);
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  private referenceKey(referenceType: string, code: string): string {
    return `${referenceType.trim().toLowerCase()}::${code.trim().toLowerCase()}`;
  }

  private policyKey(
    policyKey: string,
    scopeType: PolicyConfiguration["scopeType"],
    scopeId: string,
  ): string {
    return `${policyKey.trim().toLowerCase()}::${scopeType}::${scopeId.trim()}`;
  }

  private cloneInstitution(institution: Institution): Institution {
    return {
      ...institution,
      externalRefs: institution.externalRefs
        ? { ...institution.externalRefs }
        : undefined,
    };
  }

  private clonePolicy(policy: PolicyConfiguration): PolicyConfiguration {
    return { ...policy, value: structuredClone(policy.value) };
  }

  private validation(message: string): AppException {
    return new AppException({ code: ErrorCode.Validation, message });
  }

  private conflict(message: string): AppException {
    return new AppException({
      code: ErrorCode.Conflict,
      message,
      status: HttpStatus.CONFLICT,
    });
  }

  private notFound(message: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      message,
      status: HttpStatus.NOT_FOUND,
    });
  }
}
