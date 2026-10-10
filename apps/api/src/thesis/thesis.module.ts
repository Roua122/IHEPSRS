import { Module } from "@nestjs/common";

import { PrototypeAuditService } from "../common/audit/prototype-audit.service";
import { IdentityModule } from "../identity/identity.module";
import { InstitutionsModule } from "../institutions/institutions.module";
import { ResearchModule } from "../research/research.module";
import { ThesisAuthorizationService } from "./thesis-authorization.service";
import { ThesisSupervisionContextService } from "./thesis-supervision-context.service";
import { ThesisSupervisorController } from "./thesis-supervisor.controller";
import { ThesisSupervisorService } from "./thesis-supervisor.service";

@Module({
  imports: [IdentityModule, InstitutionsModule, ResearchModule],
  controllers: [ThesisSupervisorController],
  providers: [
    PrototypeAuditService,
    ThesisAuthorizationService,
    ThesisSupervisionContextService,
    ThesisSupervisorService,
  ],
  exports: [ThesisSupervisionContextService, ThesisSupervisorService],
})
export class ThesisModule {}
