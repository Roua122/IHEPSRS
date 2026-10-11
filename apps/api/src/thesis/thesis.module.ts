import { Module } from "@nestjs/common";

import { PrototypeAuditService } from "../common/audit/prototype-audit.service";
import { IdentityModule } from "../identity/identity.module";
import { InstitutionsModule } from "../institutions/institutions.module";
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
import { ThesisAuthorizationService } from "./thesis-authorization.service";
import { ThesisSupervisionContextService } from "./thesis-supervision-context.service";
import { ThesisSupervisorController } from "./thesis-supervisor.controller";
import { ThesisSupervisorService } from "./thesis-supervisor.service";

@Module({
  imports: [
    IdentityModule,
    InstitutionsModule,
    PostgraduateModule,
    ResearchModule,
  ],
  controllers: [ThesisSupervisorController, ThesesController],
  providers: [
    PrototypeAuditService,

    // TASK-TH-002
    ThesisAuthorizationService,
    ThesisSupervisionContextService,
    ThesisSupervisorService,

    // TASK-TH-001 / TH-003 / TH-004
    ThesisEntityService,
    {
      provide: ThesisDocumentGateway,
      useClass: UnavailableThesisDocumentGateway,
    },
    {
      provide: ThesisSupervisorGateway,
      useClass: UnavailableThesisSupervisorGateway,
    },
    {
      provide: ThesisSubmissionRequirementsGateway,
      useClass: UnavailableThesisSubmissionRequirementsGateway,
    },
  ],
  exports: [
    ThesisSupervisionContextService,
    ThesisSupervisorService,
    ThesisEntityService,
  ],
})
export class ThesisModule {}
