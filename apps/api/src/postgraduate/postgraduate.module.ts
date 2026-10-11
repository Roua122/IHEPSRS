import { Module } from "@nestjs/common";
import { InstitutionsModule } from "../institutions/institutions.module";
import { ConfigurationModule } from "../config/configuration.module";
import { IdentityModule } from "../identity/identity.module";
import { ResearchModule } from "../research/research.module";
import { ApplicantsController } from "./controllers/applicants.controller";
import { ApplicationsController } from "./controllers/applications.controller";
import { EnrollmentsController } from "./controllers/enrollments.controller";
import { AcademicAuditService } from "./domain/academic-audit.service";
import { AcademicAuthorizationService } from "./domain/academic-authorization.service";
import { AcademicReferenceService } from "./domain/academic-reference.service";
import { ApplicantService } from "./domain/applicant.service";
import { AdmissionDecisionEvidenceService } from "./domain/admission-decision-evidence.service";
import {
  ApplicationDocumentGateway,
  UnavailableApplicationDocumentGateway,
} from "./domain/application-document.gateway";
import { ApplicationNotificationOutboxService } from "./domain/application-notification-outbox.service";
import { ApplicationWorkflowService } from "./domain/application-workflow.service";
import { EnrollmentLifecycleService } from "./domain/enrollment-lifecycle.service";
import { EnrollmentPolicyService } from "./domain/enrollment-policy.service";
import {
  DegreeReadinessGateway,
  UnavailableDegreeReadinessGateway,
} from "./domain/degree-readiness.gateway";

@Module({
  imports: [
    ConfigurationModule,
    IdentityModule,
    InstitutionsModule,
    ResearchModule,
  ],
  controllers: [
    ApplicantsController,
    ApplicationsController,
    EnrollmentsController,
  ],
  providers: [
    AcademicAuthorizationService,
    AcademicAuditService,
    AcademicReferenceService,
    ApplicantService,
    ApplicationWorkflowService,
    EnrollmentLifecycleService,
    EnrollmentPolicyService,
    AdmissionDecisionEvidenceService,
    ApplicationNotificationOutboxService,
    {
      provide: DegreeReadinessGateway,
      useClass: UnavailableDegreeReadinessGateway,
    },
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
    EnrollmentLifecycleService,
    EnrollmentPolicyService,
  ],
})
export class PostgraduateModule {}
