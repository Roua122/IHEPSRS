import { Module } from "@nestjs/common";

import { AccountModelController } from "./account-model.controller";
import { AuthorizationDecisionService } from "./authorization/authorization-decision.service";
import { ScopeAuthorizationGuard } from "./authorization/authorization.guard";
import { RoleCatalogueController } from "./role-catalogue.controller";

@Module({
  controllers: [AccountModelController, RoleCatalogueController],
  providers: [AuthorizationDecisionService, ScopeAuthorizationGuard],
  exports: [AuthorizationDecisionService, ScopeAuthorizationGuard],
})
export class IdentityModule {}
