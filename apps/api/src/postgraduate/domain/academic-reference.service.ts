import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import {
  type AcademicProgram,
  InstitutionsService,
} from "../../institutions/institutions.service";
import type {
  AdmissionCycleReference,
  ProgramReference,
} from "./academic.types";

/**
 * Postgraduate academic-reference adapter.
 *
 * Canonical Institution/AcademicProgram identity, versioning and effective-date
 * validation come from InstitutionsService.
 *
 * AdmissionCycle and application-document requirements remain prototype
 * fixtures until their owning shared registries/adapters are integrated.
 */
@Injectable()
export class AcademicReferenceService {
  /**
   * Explicit prototype application requirements configuration.
   * An empty array means "configured with no mandatory document purposes".
   * Missing programId means requirements are NOT configured.
   */
  private readonly applicationRequirements = new Map<string, readonly string[]>(
    [["PROGRAM-DEMO-001", []]],
  );

  /**
   * AdmissionCycle has no canonical shared registry in the current checkout.
   * Keep this fixture isolated instead of duplicating AcademicProgram data.
   */
  private readonly cycles = new Map<string, AdmissionCycleReference>([
    [
      "CYCLE-DEMO-2026",
      {
        admissionCycleId: "CYCLE-DEMO-2026",
        programId: "PROGRAM-DEMO-001",
        applicationOpenAt: "2026-01-01T00:00:00.000Z",
        applicationCloseAt: "2026-12-31T23:59:59.000Z",
        intakeStartDate: "2026-10-01",
        status: "Open",
      },
    ],
  ]);

  constructor(private readonly institutions: InstitutionsService) {}

  /**
   * General canonical program read.
   *
   * This intentionally does NOT require the latest version to be Active:
   * admission/enrollment workflows may need historical/inactive metadata
   * before deciding PendingValidation under BR-008.
   */
  getProgram(programId: string): ProgramReference {
    return this.toProgramReference(
      this.institutions.getLatestProgramForIntegration(programId),
    );
  }

  /**
   * Trusted effective-date gate backed by INS001-004.
   * Includes canonical Institution and OrgUnit eligibility checks.
   */
  assertProgramEffective(programId: string, date: string): ProgramReference {
    return this.toProgramReference(
      this.institutions.assertProgramEligible(programId, date),
    );
  }

  /**
   * BR-008 helper: lack of an eligible canonical version at this date means
   * PendingValidation rather than trusting stale local program metadata.
   */
  isProgramEffective(programId: string, date: string): boolean {
    try {
      this.institutions.assertProgramEligible(programId, date);
      return true;
    } catch (error) {
      if (error instanceof AppException) return false;
      throw error;
    }
  }

  /**
   * BR-006: distinguish an explicitly configured empty requirements list
   * from missing program requirements configuration.
   */
  getRequiredApplicationDocumentPurposes(programId: string): readonly string[] {
    const purposes = this.applicationRequirements.get(programId);

    if (!purposes) {
      throw new AppException({
        code: ErrorCode.ServiceUnavailable,
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          "BR-006/FR-029: application document requirements are not configured for this program",
      });
    }

    return [...purposes];
  }

  /** Cohort IDs must be supplied by a trusted registry, not caller input. */
  hasTrustedCohort(programId: string, cohortId: string): boolean {
    return [...this.cycles.values()].some(
      (cycle) => cycle.programId === programId && cycle.cohortId === cohortId,
    );
  }

  getCycle(admissionCycleId: string): AdmissionCycleReference {
    const record = this.cycles.get(admissionCycleId);
    if (!record) throw this.notFound("AdmissionCycle", admissionCycleId);
    return { ...record };
  }

  assertCycleAvailable(
    cycleId: string,
    programId: string,
    at = new Date(),
  ): AdmissionCycleReference {
    const cycle = this.getCycle(cycleId);

    if (
      cycle.programId !== programId ||
      cycle.status !== "Open" ||
      at.getTime() < Date.parse(cycle.applicationOpenAt) ||
      at.getTime() > Date.parse(cycle.applicationCloseAt)
    ) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message: "UC-04: admission cycle is not open for this program",
      });
    }

    return cycle;
  }

  private toProgramReference(program: AcademicProgram): ProgramReference {
    return {
      programId: program.programId,
      institutionId: program.institutionId,
      orgUnitId: program.orgUnitId,
      status: program.status === "Active" ? "Active" : "Inactive",
      effectiveFrom: program.effectiveFrom,
      effectiveTo: program.effectiveTo,
      versionNo: program.versionNo,
      thesisRequired: program.thesisRequired,

      // Compatibility field only. Submission code must use
      // getRequiredApplicationDocumentPurposes() so missing configuration
      // cannot silently become "no required documents".
      requiredApplicationDocumentPurposes: [
        ...(this.applicationRequirements.get(program.programId) ?? []),
      ],
    };
  }

  private notFound(type: string, id: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message: `${type} ${id} not found`,
    });
  }
}
