import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { getCorrelationId } from "../../common/observability/correlation-context";
import { ResearchAuditService } from "../../research/domain/research-audit.service";
import type { StatusHistoryRecord } from "./academic.types";

/** Append-only prototype record. Shared hash-chain Audit implementation. */
@Injectable()
export class AcademicAuditService {
  private readonly statusHistory: StatusHistoryRecord[] = [];

  constructor(private readonly audit: ResearchAuditService) {}

  record(
    actorUserId: string,
    action: string,
    entityType: string,
    entityId: string,
    sourceId: string,
  ): void {
    this.audit.append({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: { sourceId },
    });
  }

  transition(input: {
    entityType: StatusHistoryRecord["entityType"];
    entityId: string;
    fromStatus?: string;
    toStatus: string;
    actorUserId: string;
    sourceId: string;
    reasonCode?: string;
  }): StatusHistoryRecord {
    const entry: StatusHistoryRecord = {
      statusHistoryId: randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      changedAt: new Date().toISOString(),
      changedByUserId: input.actorUserId,
      reasonCode: input.reasonCode,
      correlationId: getCorrelationId(),
    };
    this.statusHistory.push(entry);
    this.record(
      input.actorUserId,
      `${input.entityType}.status.${input.toStatus}`,
      input.entityType,
      input.entityId,
      input.sourceId,
    );
    return { ...entry };
  }

  history(entityType: StatusHistoryRecord["entityType"], entityId: string) {
    return this.statusHistory
      .filter(
        (item) => item.entityType === entityType && item.entityId === entityId,
      )
      .map((item) => ({ ...item }));
  }
}
