import { Module } from "@nestjs/common";

import { PrototypeAuditService } from "../common/audit/prototype-audit.service";
import { IdentityModule } from "../identity/identity.module";
import { InstitutionAuthorizationService } from "./institution-authorization.service";
import { InstitutionsController } from "./institutions.controller";
import { InstitutionsService } from "./institutions.service";

@Module({
  imports: [IdentityModule],
  controllers: [InstitutionsController],
  providers: [
    PrototypeAuditService,
    InstitutionAuthorizationService,
    InstitutionsService,
  ],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}
