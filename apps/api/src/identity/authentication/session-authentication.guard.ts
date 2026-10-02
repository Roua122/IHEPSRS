import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { writeStructuredLog } from "../../common/observability/structured-log";
import type { AuthorizationAwareRequest } from "../authorization/authorization.guard";
import { PUBLIC_ROUTE_METADATA } from "./route-access.decorator";
import { SessionService } from "./session.service";

interface HeaderAwareRequest extends AuthorizationAwareRequest {
  headers?: Record<string, string | string[] | undefined>;
}

@Injectable()
export class SessionAuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<HeaderAwareRequest>();
    const authorization = request.headers?.authorization;
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const session = token ? this.sessions.authenticate(token) : null;

    if (!session) {
      writeStructuredLog({
        level: "warn",
        event: "security.authentication.denied",
        reason: "SESSION_MISSING_OR_INVALID",
      });
      throw new AppException({
        code: ErrorCode.Unauthorized,
        status: HttpStatus.UNAUTHORIZED,
        message: "Authentication required",
      });
    }

    request.authorizationPrincipal = session.principal;
    request.authenticationSession = {
      sessionId: session.sessionId,
      userId: session.principal.userId,
      profile: session.profile,
    };

    return true;
  }
}
