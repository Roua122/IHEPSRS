import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { IdentityMergeDto, IdentityUnmergeDto } from "@ihepsrs/contracts";

import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import { PersonIdentityService } from "../domain/person-identity.service";
import { ResearchAuthorizationService } from "../domain/research-authorization.service";

function principalOf(
  request: AuthorizationAwareRequest,
): AuthorizationPrincipal {
  return request.authorizationPrincipal!;
}

@AuthenticatedOnly()
@Controller("research")
export class ResearchersController {
  constructor(
    private readonly identityService: PersonIdentityService,
    private readonly authorization: ResearchAuthorizationService,
  ) {}

  @Get("researchers")
  getAllResearchers(@Req() request: AuthorizationAwareRequest) {
    const principal = principalOf(request);
    return this.identityService.getAllResearchers().filter((researcher) => {
      return this.authorization.canManageInstitution(
        principal,
        researcher.institutionId,
      );
    });
  }

  @Get("researchers/:id")
  getResearcher(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    const researcher = this.identityService.getResearcher(id);
    const principal = principalOf(request);
    this.authorization.assertResearchOperation(
      principal,
      researcher.institutionId,
    );
    return researcher;
  }

  @Post("researchers")
  saveResearcher(
    @Body()
    body: {
      researcherId?: string;
      personId: string;
      institutionId: string;
      orcid?: string;
      specializationCode?: string;
      status?: "Active" | "Inactive";
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    const principal = principalOf(request);
    this.authorization.assertResearchOperation(principal, body.institutionId);
    return this.identityService.createOrUpdateResearcher(body);
  }

  @Post("researchers/:id/orcid/verify")
  verifyOrcid(
    @Param("id") id: string,
    @Body() body: { orcid: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    const researcher = this.identityService.getResearcher(id);
    const principal = principalOf(request);
    this.authorization.assertResearchOperation(
      principal,
      researcher.institutionId,
    );
    return this.identityService.verifyResearcherOrcid(id, body.orcid);
  }

  // Raw national identifiers are deliberately not accepted in the URL or response.
  @Post("persons/match")
  matchPersons(
    @Body()
    body: {
      nationalIdentifierFingerprint?: string;
      sourceSystem?: string;
      externalId?: string;
      email?: string;
      birthDate?: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    const principal = principalOf(request);
    this.authorization.assertIdentityStewardRole(principal);
    return this.identityService
      .findMatchingPersons(body)
      .filter((person) =>
        this.authorization.canResolvePerson(principal, person.personId),
      );
  }

  @Get("persons/:id")
  getPerson(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    this.authorization.assertIdentitySteward(principalOf(request), id);
    return this.identityService.getPerson(id);
  }

  @Post("identity/merge")
  mergePersonIdentities(
    @Body() dto: IdentityMergeDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    const principal = principalOf(request);
    this.authorization.assertIdentitySteward(principal, dto.sourcePersonId);
    this.authorization.assertIdentitySteward(principal, dto.targetPersonId);
    return this.identityService.mergePersonIdentities(dto, principal.userId);
  }

  @Post("identity/unmerge")
  unmergePersonIdentities(
    @Body() dto: IdentityUnmergeDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    const principal = principalOf(request);
    this.authorization.assertIdentityStewardRole(principal);
    const audit = this.identityService
      .getMergeAuditLogs()
      .find((entry) => entry.auditId === dto.auditId);
    if (audit) {
      this.authorization.assertIdentitySteward(principal, audit.sourcePersonId);
      this.authorization.assertIdentitySteward(principal, audit.targetPersonId);
    }
    this.identityService.unmergePersonIdentities(dto, principal.userId);
    return { success: true };
  }

  @Get("identity/merge-audit")
  getMergeAuditLogs(@Req() request: AuthorizationAwareRequest) {
    const principal = principalOf(request);
    this.authorization.assertIdentityStewardRole(principal);
    return this.identityService
      .getMergeAuditLogs()
      .filter(
        (entry) =>
          this.authorization.canResolvePerson(
            principal,
            entry.sourcePersonId,
          ) &&
          this.authorization.canResolvePerson(principal, entry.targetPersonId),
      );
  }
}
