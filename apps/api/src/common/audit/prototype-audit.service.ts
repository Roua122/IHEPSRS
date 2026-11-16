import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";

import { getCorrelationId } from "../observability/correlation-context";

export interface PrototypeAuditEntry {
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

/**
 * Shared academic-prototype audit chain.
 *
 * This is intentionally in-memory and tamper-evident, not a production WORM
 * audit repository. Durable audit persistence remains deployment work.
 */
@Injectable()
export class PrototypeAuditService {
  private readonly entries: PrototypeAuditEntry[] = [];

  append(input: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, string | number | boolean | null>;
  }): PrototypeAuditEntry {
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
    const entry: PrototypeAuditEntry = { ...base, entryHash };
    this.entries.push(entry);
    return this.clone(entry);
  }

  list(): readonly PrototypeAuditEntry[] {
    return this.entries.map((entry) => this.clone(entry));
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

  snapshotLength(): number {
    return this.entries.length;
  }

  rollbackTo(length: number): void {
    if (
      !Number.isInteger(length) ||
      length < 0 ||
      length > this.entries.length
    ) {
      throw new Error("Invalid audit rollback position");
    }
    this.entries.splice(length);
  }

  private clone(entry: PrototypeAuditEntry): PrototypeAuditEntry {
    return {
      ...entry,
      metadata: entry.metadata ? { ...entry.metadata } : undefined,
    };
  }
}
