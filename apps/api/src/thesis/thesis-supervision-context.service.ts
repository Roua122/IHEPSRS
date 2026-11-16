import { HttpStatus, Injectable } from "@nestjs/common";

import type { ThesisSupervisionContext } from "@ihepsrs/contracts";

import { AppException } from "../common/errors/app-exception";
import { ErrorCode } from "../common/errors/error-code";

/**
 * Prototype integration adapter for TH-002.
 *
 * TH-001 owns the canonical Thesis entity. Until that task is merged, TH-002
 * stores only the minimal, non-authoritative context required to validate
 * supervisor assignments. TH-001 can register/update this adapter or replace
 * it with the canonical repository without changing TH-002 business rules.
 */
@Injectable()
export class ThesisSupervisionContextService {
  private readonly contexts = new Map<string, ThesisSupervisionContext>();

  register(context: ThesisSupervisionContext): ThesisSupervisionContext {
    const record: ThesisSupervisionContext = {
      thesisId: context.thesisId.trim(),
      institutionId: context.institutionId.trim(),
      programId: context.programId.trim(),
      studentPersonId: context.studentPersonId.trim(),
    };
    if (
      !record.thesisId ||
      !record.institutionId ||
      !record.programId ||
      !record.studentPersonId
    ) {
      throw new AppException({
        code: ErrorCode.Validation,
        message: "Thesis supervision context fields are required",
      });
    }
    this.contexts.set(record.thesisId, record);
    return { ...record };
  }

  get(thesisId: string): ThesisSupervisionContext {
    const context = this.contexts.get(thesisId);
    if (!context) {
      throw new AppException({
        code: ErrorCode.NotFound,
        status: HttpStatus.NOT_FOUND,
        message: `Thesis supervision context ${thesisId} not found`,
      });
    }
    return { ...context };
  }

  snapshot(): Map<string, ThesisSupervisionContext> {
    return structuredClone(this.contexts);
  }

  restore(snapshot: Map<string, ThesisSupervisionContext>): void {
    this.contexts.clear();
    for (const [key, value] of snapshot.entries()) {
      this.contexts.set(key, { ...value });
    }
  }
}
