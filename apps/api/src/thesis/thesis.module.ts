import { Module } from "@nestjs/common";

import { PostgraduateModule } from "../postgraduate/postgraduate.module";
import { ResearchModule } from "../research/research.module";
import { ThesesController } from "./controllers/theses.controller";
import {
  ThesisDocumentGateway,
  UnavailableThesisDocumentGateway,
} from "./domain/thesis-document.gateway";
import { ThesisEntityService } from "./domain/thesis-entity.service";
import {
  ThesisSubmissionRequirementsGateway,
  UnavailableThesisSubmissionRequirementsGateway,
} from "./domain/thesis-submission-requirements.gateway";
import {
  ThesisSupervisorGateway,
  UnavailableThesisSupervisorGateway,
} from "./domain/thesis-supervisor.gateway";

@Module({
  imports: [PostgraduateModule, ResearchModule],
  controllers: [ThesesController],
  providers: [
    ThesisEntityService,
    { provide: ThesisDocumentGateway, useClass: UnavailableThesisDocumentGateway },
    { provide: ThesisSupervisorGateway, useClass: UnavailableThesisSupervisorGateway },
    {
      provide: ThesisSubmissionRequirementsGateway,
      useClass: UnavailableThesisSubmissionRequirementsGateway,
    },
  ],
  exports: [ThesisEntityService],
})
export class ThesisModule {}
