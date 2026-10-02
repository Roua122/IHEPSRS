import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { AuthorizationPrincipal } from "../authorization/authorization.types";
import type {
  AuthenticatedSession,
  SessionSecurityProfile,
} from "./authentication.types";

interface SessionRecord {
  sessionId: string;
  tokenHash: string;
  principal: AuthorizationPrincipal;
  profile: SessionSecurityProfile;
  createdAt: number;
  lastSeenAt: number;
  maxExpiresAt: number;
  mfaVerifiedAt: number;
  revokedAt?: number;
  sensitiveReauthenticationArmed: boolean;
}

const PROFILE_LIMITS = {
  SENSITIVE: { idleMs: 15 * 60 * 1000, maxMs: 8 * 60 * 60 * 1000 },
  REGULAR: { idleMs: 30 * 60 * 1000, maxMs: 12 * 60 * 60 * 1000 },
} as const;

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class SessionService {
  private readonly sessionsByHash = new Map<string, SessionRecord>();
  private readonly tokenHashBySessionId = new Map<string, string>();

  create(
    principal: AuthorizationPrincipal,
    profile: SessionSecurityProfile,
    at = Date.now(),
  ): { accessToken: string; session: AuthenticatedSession } {
    const accessToken = randomBytes(32).toString("base64url");
    const hash = tokenHash(accessToken);
    const sessionId = randomUUID();
    const limits = PROFILE_LIMITS[profile];

    const record: SessionRecord = {
      sessionId,
      tokenHash: hash,
      principal,
      profile,
      createdAt: at,
      lastSeenAt: at,
      maxExpiresAt: at + limits.maxMs,
      mfaVerifiedAt: at,
      sensitiveReauthenticationArmed: false,
    };

    this.sessionsByHash.set(hash, record);
    this.tokenHashBySessionId.set(sessionId, hash);

    return { accessToken, session: this.toPublicSession(record) };
  }

  authenticate(
    accessToken: string,
    at = Date.now(),
  ): AuthenticatedSession | null {
    const record = this.sessionsByHash.get(tokenHash(accessToken));
    if (!record || !this.isActive(record, at)) {
      return null;
    }

    record.lastSeenAt = at;
    return this.toPublicSession(record);
  }

  getPrincipal(sessionId: string): AuthorizationPrincipal | null {
    const record = this.getBySessionId(sessionId);
    return record?.principal ?? null;
  }

  revokeBySessionId(sessionId: string, at = Date.now()): boolean {
    const record = this.getBySessionId(sessionId);
    if (!record || record.revokedAt) {
      return false;
    }
    record.revokedAt = at;
    return true;
  }

  revokeAllForUser(userId: string, at = Date.now()): number {
    let revoked = 0;
    for (const record of this.sessionsByHash.values()) {
      if (record.principal.userId === userId && !record.revokedAt) {
        record.revokedAt = at;
        revoked += 1;
      }
    }
    return revoked;
  }

  armSensitiveReauthentication(sessionId: string): boolean {
    const record = this.getBySessionId(sessionId);
    if (!record || record.revokedAt) {
      return false;
    }
    record.sensitiveReauthenticationArmed = true;
    return true;
  }

  consumeSensitiveReauthentication(sessionId: string): boolean {
    const record = this.getBySessionId(sessionId);
    if (!record?.sensitiveReauthenticationArmed || record.revokedAt) {
      return false;
    }
    record.sensitiveReauthenticationArmed = false;
    return true;
  }

  describe(sessionId: string, at = Date.now()): AuthenticatedSession | null {
    const record = this.getBySessionId(sessionId);
    if (!record || !this.isActive(record, at)) {
      return null;
    }
    return this.toPublicSession(record);
  }

  private getBySessionId(sessionId: string): SessionRecord | null {
    const hash = this.tokenHashBySessionId.get(sessionId);
    return hash ? (this.sessionsByHash.get(hash) ?? null) : null;
  }

  private isActive(record: SessionRecord, at: number): boolean {
    if (record.revokedAt || at >= record.maxExpiresAt) {
      return false;
    }

    const limits = PROFILE_LIMITS[record.profile];
    return at - record.lastSeenAt < limits.idleMs;
  }

  private toPublicSession(record: SessionRecord): AuthenticatedSession {
    const limits = PROFILE_LIMITS[record.profile];
    const idleExpiresAt = record.lastSeenAt + limits.idleMs;
    const expiresAt = Math.min(idleExpiresAt, record.maxExpiresAt);

    return {
      sessionId: record.sessionId,
      principal: record.principal,
      profile: record.profile,
      idleTimeoutMinutes: limits.idleMs / 60_000,
      maxSessionHours: limits.maxMs / 3_600_000,
      createdAt: new Date(record.createdAt).toISOString(),
      lastSeenAt: new Date(record.lastSeenAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      mfaVerifiedAt: new Date(record.mfaVerifiedAt).toISOString(),
    };
  }
}
