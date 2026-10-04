import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { CreatePublicationDto } from "@ihepsrs/contracts";

import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import { PublicationService } from "../domain/publication.service";

@AuthenticatedOnly()
@Controller("publications")
export class PublicationsController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get()
  getAllPublications(@Req() request: AuthorizationAwareRequest) {
    return this.publicationService.getAllPublications(
      request.authorizationPrincipal!,
    );
  }

  @Get(":id")
  getPublication(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.publicationService.getPublication(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post()
  registerPublication(
    @Body() dto: CreatePublicationDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.publicationService.registerPublication(
      dto,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/submit-validation")
  submitValidation(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.publicationService.submitForValidation(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/validation")
  recordValidation(
    @Param("id") id: string,
    @Body() dto: { valid: boolean; reason?: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.publicationService.recordIdentifierValidation(
      id,
      dto.valid,
      request.authorizationPrincipal!,
      dto.reason,
    );
  }

  @Post(":id/publish")
  publishRecord(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.publicationService.publishRecord(
      id,
      request.authorizationPrincipal!,
    );
  }

  @Post(":id/archive")
  archivePublication(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.publicationService.archivePublication(
      id,
      request.authorizationPrincipal!,
    );
  }
}
