import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";

import { getCorrelationId } from "../../common/observability/correlation-context";

export interface ResearchAuditEntry {
  auditId: string;
  occurredAt: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  correlationId?: string;
  previousHash: string | null;
  entryHash: string;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

@Injectable()
export class ResearchAuditService {
  private readonly entries: ResearchAuditEntry[] = [];

  append(input: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, string | number | boolean | null>;
  }): ResearchAuditEntry {
    const previousHash = this.entries.at(-1)?.entryHash ?? null;
    const base = {
      auditId: randomUUID(),
      occurredAt: new Date().toISOString(),
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      correlationId: getCorrelationId(),
      previousHash,
      metadata: input.metadata ? { ...input.metadata } : undefined,
    };
    const entryHash = createHash("sha256")
      .update(JSON.stringify(base))
      .digest("hex");
    const entry: ResearchAuditEntry = { ...base, entryHash };
    this.entries.push(entry);
    return {
      ...entry,
      metadata: entry.metadata ? { ...entry.metadata } : undefined,
    };
  }

  list(): readonly ResearchAuditEntry[] {
    return this.entries.map((entry) => ({
      ...entry,
      metadata: entry.metadata ? { ...entry.metadata } : undefined,
    }));
  }

  verifyChain(): boolean {
    let previousHash: string | null = null;
    for (const entry of this.entries) {
      if (entry.previousHash !== previousHash) return false;
      const { entryHash, ...base } = entry;
      const expected = createHash("sha256")
        .update(JSON.stringify(base))
        .digest("hex");
      if (entryHash !== expected) return false;
      previousHash = entryHash;
    }
    return true;
  }
}
