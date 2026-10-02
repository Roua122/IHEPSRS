import { Module } from "@nestjs/common";

import { AccountModelController } from "./account-model.controller";
import { AuthorizationDecisionService } from "./authorization/authorization-decision.service";
import { ScopeAuthorizationGuard } from "./authorization/authorization.guard";
import { DelegationAuthorizationService } from "./delegation/delegation-authorization.service";
import { DelegationPolicyService } from "./delegation/delegation-policy.service";
import { RoleCatalogueController } from "./role-catalogue.controller";

@Module({
  controllers: [AccountModelController, RoleCatalogueController],
  providers: [
    AuthorizationDecisionService,
    ScopeAuthorizationGuard,
    DelegationPolicyService,
    DelegationAuthorizationService,
  ],
  exports: [
    AuthorizationDecisionService,
    ScopeAuthorizationGuard,
    DelegationPolicyService,
    DelegationAuthorizationService,
  ],
})
export class IdentityModule {}
