import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import { ApplicantService } from "../domain/applicant.service";

@AuthenticatedOnly()
@Controller("postgraduate/applicants")
export class ApplicantsController {
  constructor(private readonly applicants: ApplicantService) {}

  @Post("self")
  registerSelf(
    @Body()
    body: {
      fullNameAr?: string;
      fullNameEn?: string;
      email?: string;
      birthDate?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.applicants.registerSelf(body, request.authorizationPrincipal!);
  }

  @Get("self")
  getSelf(@Req() request: AuthorizationAwareRequest) {
    return this.applicants.getOwnPerson(request.authorizationPrincipal!);
  }
}
