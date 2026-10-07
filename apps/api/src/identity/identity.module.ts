import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AccountModelController } from "./account-model.controller";
import { AuthenticationController } from "./authentication/authentication.controller";
import { AuthenticationService } from "./authentication/authentication.service";
import { LocalCredentialPolicyService } from "./authentication/local-credential-policy.service";
import { LoginAttemptTrackerService } from "./authentication/login-attempt-tracker.service";
import { PrototypeLocalIdentityService } from "./authentication/prototype-local-identity.service";
import { SessionAuthenticationGuard } from "./authentication/session-authentication.guard";
import { SessionService } from "./authentication/session.service";
import { TotpService } from "./authentication/totp.service";
import { AuthorizationDecisionService } from "./authorization/authorization-decision.service";
import { ScopeAuthorizationGuard } from "./authorization/authorization.guard";
import { DelegationAuthorizationService } from "./delegation/delegation-authorization.service";
import { DelegationPolicyService } from "./delegation/delegation-policy.service";
import { RoleCatalogueController } from "./role-catalogue.controller";

@Module({
  controllers: [
    AccountModelController,
    RoleCatalogueController,
    AuthenticationController,
  ],
  providers: [
    AuthorizationDecisionService,
    ScopeAuthorizationGuard,
    DelegationPolicyService,
    DelegationAuthorizationService,
    LocalCredentialPolicyService,
    LoginAttemptTrackerService,
    PrototypeLocalIdentityService,
    TotpService,
    SessionService,
    AuthenticationService,
    SessionAuthenticationGuard,
    {
      provide: APP_GUARD,
      useExisting: SessionAuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: ScopeAuthorizationGuard,
    },
  ],
  exports: [
    AuthorizationDecisionService,
    ScopeAuthorizationGuard,
    DelegationPolicyService,
    DelegationAuthorizationService,
    SessionService,
    AuthenticationService,
  ],
})
export class IdentityModule {}
