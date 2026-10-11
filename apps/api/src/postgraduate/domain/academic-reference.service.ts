import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type {
  AdmissionCycleReference,
  ProgramReference,
} from "./academic.types";

/**
 * MOCK-ONLY adapter until the INS001-004 registry supplies stable contracts.
 * These records are academic demonstration fixtures, not a replacement for the
 * institution registry and NOT regulatory policies. Fail closed for unknown ids.
 */
@Injectable()
export class AcademicReferenceService {
  private readonly programs = new Map<string, ProgramReference>([
    [
      "PROGRAM-DEMO-001",
      {
        programId: "PROGRAM-DEMO-001",
        institutionId: "INST-001",
        orgUnitId: "ORG-DEMO-001",
        status: "Active",
        effectiveFrom: "2026-01-01",
        versionNo: 1,
        thesisRequired: true,
        requiredApplicationDocumentPurposes: [],
      },
    ],
  ]);
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

  getProgram(programId: string): ProgramReference {
    const record = this.programs.get(programId);
    if (!record) throw this.notFound("AcademicProgram", programId);
    return {
      ...record,
      requiredApplicationDocumentPurposes: [
        ...record.requiredApplicationDocumentPurposes,
      ],
    };
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

  assertProgramEffective(programId: string, date: string): ProgramReference {
    const record = this.getProgram(programId);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T00:00:00Z`))
    ) {
      throw new AppException({
        code: ErrorCode.Validation,
        message: "BR-003/BR-042: invalid effective date",
      });
    }
    if (
      record.status !== "Active" ||
      record.effectiveFrom > date ||
      (record.effectiveTo && record.effectiveTo < date)
    ) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message: "BR-003/BR-008: academic program is not effective",
      });
    }
    return record;
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

  /** Test adapter fixture only: never exposed as an HTTP write operation. */
  replaceMockProgramForTest(program: ProgramReference): void {
    this.programs.set(program.programId, {
      ...program,
      requiredApplicationDocumentPurposes: [
        ...program.requiredApplicationDocumentPurposes,
      ],
    });
  }

  private notFound(type: string, id: string): AppException {
    return new AppException({
      code: ErrorCode.NotFound,
      status: HttpStatus.NOT_FOUND,
      message: `${type} ${id} not found`,
    });
  }
}
