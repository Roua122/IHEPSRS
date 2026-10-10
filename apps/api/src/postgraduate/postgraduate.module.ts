import { Module } from "@nestjs/common";

import { IdentityModule } from "../identity/identity.module";
import { ResearchModule } from "../research/research.module";
import { ApplicantsController } from "./controllers/applicants.controller";
import { ApplicationsController } from "./controllers/applications.controller";
import { AcademicAuditService } from "./domain/academic-audit.service";
import { AcademicAuthorizationService } from "./domain/academic-authorization.service";
import { AcademicReferenceService } from "./domain/academic-reference.service";
import { ApplicantService } from "./domain/applicant.service";
import { ApplicationDocumentGateway, UnavailableApplicationDocumentGateway } from "./domain/application-document.gateway";
import { ApplicationNotificationOutboxService } from "./domain/application-notification-outbox.service";
import { ApplicationWorkflowService } from "./domain/application-workflow.service";

@Module({
  imports: [IdentityModule, ResearchModule],
  controllers: [ApplicantsController, ApplicationsController],
  providers: [
    AcademicAuthorizationService,
    AcademicAuditService,
    AcademicReferenceService,
    ApplicantService,
    ApplicationWorkflowService,
    ApplicationNotificationOutboxService,
    {
      provide: ApplicationDocumentGateway,
      useClass: UnavailableApplicationDocumentGateway,
    },
  ],
  exports: [
    AcademicAuthorizationService,
    AcademicAuditService,
    AcademicReferenceService,
    ApplicantService,
    ApplicationWorkflowService,
  ],
})
export class PostgraduateModule {}
