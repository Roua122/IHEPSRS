import { Module } from "@nestjs/common";

import { IdentityModule } from "../identity/identity.module";
import { ResearchModule } from "../research/research.module";
import { ApplicantsController } from "./controllers/applicants.controller";
import { AcademicAuditService } from "./domain/academic-audit.service";
import { AcademicAuthorizationService } from "./domain/academic-authorization.service";
import { AcademicReferenceService } from "./domain/academic-reference.service";
import { ApplicantService } from "./domain/applicant.service";

@Module({
  imports: [IdentityModule, ResearchModule],
  controllers: [ApplicantsController],
  providers: [
    AcademicAuthorizationService,
    AcademicAuditService,
    AcademicReferenceService,
    ApplicantService,
  ],
  exports: [
    AcademicAuthorizationService,
    AcademicAuditService,
    AcademicReferenceService,
    ApplicantService,
  ],
})
export class PostgraduateModule {}
