import { HttpStatus, Injectable } from "@nestjs/common";
import { createHash, timingSafeEqual } from "node:crypto";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { writeStructuredLog } from "../../common/observability/structured-log";
import type {
  LoginRequest,
  LoginResponse,
  ReauthenticationRequest,
} from "./authentication.types";
import { LocalCredentialPolicyService } from "./local-credential-policy.service";
import { LoginAttemptTrackerService } from "./login-attempt-tracker.service";
import { PrototypeLocalIdentityService } from "./prototype-local-identity.service";
import { SessionService } from "./session.service";
import { TotpService } from "./totp.service";

function secretDigest(value: string, salt: string): Buffer {
  return createHash("sha256").update(`${salt}\u0000${value}`).digest();
}

function secureEquals(left: string, right: string): boolean {
  const salt = "ihepsrs-prototype-local-auth";
  const leftDigest = secretDigest(left, salt);
  const rightDigest = secretDigest(right, salt);
  return timingSafeEqual(leftDigest, rightDigest);
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly identities: PrototypeLocalIdentityService,
    private readonly passwordPolicy: LocalCredentialPolicyService,
    private readonly attempts: LoginAttemptTrackerService,
    private readonly totp: TotpService,
    private readonly sessions: SessionService,
  ) {}

  login(request: LoginRequest, at = Date.now()): LoginResponse {
    const subject = request.username.trim().toLowerCase() || "<empty>";

    if (!this.identities.isLocalFallbackAvailable()) {
      throw new AppException({
        code: ErrorCode.ServiceUnavailable,
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          "Prototype local authentication is unavailable while trusted SSO is available or local fallback is disabled",
      });
    }

    if (this.attempts.isLocked(subject, at)) {
      this.logFailure(subject, "TEMPORARILY_LOCKED");
      throw new AppException({
        code: ErrorCode.TooManyRequests,
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: "Authentication temporarily locked after repeated failures",
      });
    }

    const identity = this.identities.getByUsername(request.username);
    const configuredPassword =
      identity?.configuredPassword ?? "invalid-placeholder";
    const passwordDecision = this.passwordPolicy.evaluate(configuredPassword);

    const passwordValid = secureEquals(request.password, configuredPassword);
    let mfaValid = false;
    if (identity) {
      try {
        mfaValid = this.totp.verify(identity.totpSecret, request.mfaCode, at);
      } catch {
        mfaValid = false;
      }
    }

    if (
      !identity ||
      !passwordDecision.accepted ||
      !passwordValid ||
      !mfaValid ||
      !identity.account.canStartSession()
    ) {
      this.attempts.recordFailure(subject, at);
      this.logFailure(subject, "INVALID_CREDENTIALS_OR_ACCOUNT_STATE");
      throw this.unauthorized();
    }

    this.attempts.clear(subject);
    const created = this.sessions.create(
      identity.principal,
      identity.sessionProfile,
      at,
    );

    writeStructuredLog({
      level: "info",
      event: "security.authentication.succeeded",
      userId: identity.account.userId,
      sessionId: created.session.sessionId,
      mfa: true,
      localFallback: true,
    });

    return {
      accessToken: created.accessToken,
      tokenType: "Bearer",
      session: created.session,
    };
  }

  reauthenticate(
    sessionId: string,
    userId: string,
    request: ReauthenticationRequest,
    at = Date.now(),
  ): void {
    const identity = this.identities.getByUserId(userId);
    if (
      !identity ||
      !identity.account.canStartSession() ||
      !secureEquals(request.password, identity.configuredPassword) ||
      !this.verifyMfa(identity.totpSecret, request.mfaCode, at)
    ) {
      throw this.unauthorized();
    }

    if (!this.sessions.armSensitiveReauthentication(sessionId)) {
      throw this.unauthorized();
    }

    writeStructuredLog({
      level: "info",
      event: "security.authentication.reauthenticated",
      userId,
      sessionId,
      mfa: true,
    });
  }

  logout(sessionId: string): void {
    this.sessions.revokeBySessionId(sessionId);
    writeStructuredLog({
      level: "info",
      event: "security.session.revoked",
      sessionId,
    });
  }

  revokeUserSessions(userId: string): number {
    const count = this.sessions.revokeAllForUser(userId);
    writeStructuredLog({
      level: "info",
      event: "security.session.user-revoked",
      userId,
      revokedSessionCount: count,
    });
    return count;
  }

  private verifyMfa(secret: string, code: string, at: number): boolean {
    try {
      return this.totp.verify(secret, code, at);
    } catch {
      return false;
    }
  }

  private logFailure(subject: string, reason: string): void {
    writeStructuredLog({
      level: "warn",
      event: "security.authentication.failed",
      subjectFingerprint: createHash("sha256")
        .update(subject)
        .digest("hex")
        .slice(0, 16),
      reason,
    });
  }

  private unauthorized(): AppException {
    return new AppException({
      code: ErrorCode.Unauthorized,
      status: HttpStatus.UNAUTHORIZED,
      message: "Authentication failed",
    });
  }
}
