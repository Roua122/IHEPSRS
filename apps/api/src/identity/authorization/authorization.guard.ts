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
import { AuthorizationDecisionService } from "./authorization-decision.service";
import { AUTHORIZATION_POLICY_METADATA } from "./authorization.decorator";
import type {
  AuthorizationPolicy,
  AuthorizationPrincipal,
  AuthorizationRequestContext,
} from "./authorization.types";

export interface AuthorizationAwareRequest {
  authorizationPrincipal?: AuthorizationPrincipal;
  authorizationContext?: Omit<
    AuthorizationRequestContext,
    "resource" | "action"
  >;
}

@Injectable()
export class ScopeAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly decisions: AuthorizationDecisionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<AuthorizationPolicy>(
      AUTHORIZATION_POLICY_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!policy) {
      writeStructuredLog({
        level: "warn",
        event: "security.authorization.denied",
        reason: "POLICY_MISSING",
      });
      throw this.forbidden();
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthorizationAwareRequest>();
    const runtimeContext = request.authorizationContext ?? {};
    const decision = this.decisions.evaluate(
      request.authorizationPrincipal,
      {
        resource: policy.resource,
        action: policy.action,
        institutionId: runtimeContext.institutionId,
        dataScope: runtimeContext.dataScope,
        recordState: runtimeContext.recordState,
        at: runtimeContext.at,
      },
      policy,
    );

    if (!decision.allowed) {
      writeStructuredLog({
        level: "warn",
        event: "security.authorization.denied",
        userId: request.authorizationPrincipal?.userId,
        policyId: policy.policyId,
        resource: policy.resource,
        action: policy.action,
        reason: decision.reason,
        roleCodes: request.authorizationPrincipal?.roleAssignments.map(
          (assignment) => assignment.roleCode,
        ),
      });
      throw this.forbidden();
    }

    if (decision.delegationId) {
      writeStructuredLog({
        level: "info",
        event: "security.authorization.delegated",
        userId: request.authorizationPrincipal?.userId,
        policyId: policy.policyId,
        resource: policy.resource,
        action: policy.action,
        roleCode: decision.matchedRoleCode,
        delegationId: decision.delegationId,
      });
    }

    return true;
  }

  private forbidden(): AppException {
    return new AppException({
      code: ErrorCode.Forbidden,
      message: "Access denied by authorization policy",
      status: HttpStatus.FORBIDDEN,
    });
  }
}
