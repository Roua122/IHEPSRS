import { Module } from "@nestjs/common";

import { ConfigurationModule } from "../config/configuration.module";
import { IdentityModule } from "../identity/identity.module";
import { ProjectsController } from "./controllers/projects.controller";
import { ProposalsController } from "./controllers/proposals.controller";
import { ResearchersController } from "./controllers/researchers.controller";
import { ConflictOfInterestService } from "./domain/conflict-of-interest.service";
import { PersonIdentityService } from "./domain/person-identity.service";
import { ProjectService } from "./domain/project.service";
import { ProposalService } from "./domain/proposal.service";
import { ResearchAuditService } from "./domain/research-audit.service";
import { ResearchAuthorizationService } from "./domain/research-authorization.service";

@Module({
  imports: [IdentityModule, ConfigurationModule],
  controllers: [ResearchersController, ProposalsController, ProjectsController],
  providers: [
    PersonIdentityService,
    ResearchAuthorizationService,
    ResearchAuditService,
    ConflictOfInterestService,
    ProjectService,
    ProposalService,
  ],
  exports: [
    PersonIdentityService,
    ResearchAuthorizationService,
    ResearchAuditService,
    ConflictOfInterestService,
    ProjectService,
    ProposalService,
  ],
})
export class ResearchModule {}
