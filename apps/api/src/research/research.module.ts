import { Module } from "@nestjs/common";
import { PersonIdentityService } from "./domain/person-identity.service";
import { ProposalService } from "./domain/proposal.service";
import { ProjectService } from "./domain/project.service";
import { ResearchersController } from "./controllers/researchers.controller";
import { ProposalsController } from "./controllers/proposals.controller";
import { ProjectsController } from "./controllers/projects.controller";

@Module({
  controllers: [ResearchersController, ProposalsController, ProjectsController],
  providers: [PersonIdentityService, ProjectService, ProposalService],
  exports: [PersonIdentityService, ProjectService, ProposalService],
})
export class ResearchModule {}
