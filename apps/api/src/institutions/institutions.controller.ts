import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";

import { AuthenticatedOnly } from "../identity/authentication/route-access.decorator";
import type { AuthorizationAwareRequest } from "../identity/authorization/authorization.guard";
import type { AuthorizationPrincipal } from "../identity/authorization/authorization.types";
import {
  ChangeInstitutionStatusDto,
  CheckProgramEligibilityDto,
  CreateAcademicProgramDto,
  CreateInstitutionDto,
  CreateOrgUnitDto,
  CreatePolicyVersionDto,
  CreateReferenceVersionDto,
  RetirePolicyVersionDto,
  RetireReferenceDto,
  UpdateInstitutionDto,
} from "./institutions.dto";
import { InstitutionsService } from "./institutions.service";

function principalOf(
  request: AuthorizationAwareRequest,
): AuthorizationPrincipal {
  return request.authorizationPrincipal!;
}

@AuthenticatedOnly()
@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Get("references")
  references(@Req() request: AuthorizationAwareRequest) {
    return this.service.listReferenceVersions(principalOf(request));
  }

  @Post("references")
  createReference(
    @Body() dto: CreateReferenceVersionDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.createReferenceVersion(dto, principalOf(request));
  }

  @Post("references/:referenceType/:code/retire")
  retireReference(
    @Param("referenceType") referenceType: string,
    @Param("code") code: string,
    @Body() dto: RetireReferenceDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.retireReference(
      referenceType,
      code,
      dto.effectiveTo,
      principalOf(request),
    );
  }

  @Get("policies")
  policies(@Req() request: AuthorizationAwareRequest) {
    return this.service.listPolicies(principalOf(request));
  }

  @Post("policies")
  createPolicy(
    @Body() dto: CreatePolicyVersionDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.createPolicyVersion(dto, principalOf(request));
  }

  @Post("policies/:policyId/retire")
  retirePolicy(
    @Param("policyId") policyId: string,
    @Body() dto: RetirePolicyVersionDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.retirePolicy(
      policyId,
      dto.effectiveTo,
      principalOf(request),
    );
  }

  @Get("audit")
  audit(@Req() request: AuthorizationAwareRequest) {
    return this.service.listAudit(principalOf(request));
  }

  @Get()
  list(@Req() request: AuthorizationAwareRequest) {
    return this.service.listInstitutions(principalOf(request));
  }

  @Post()
  create(
    @Body() dto: CreateInstitutionDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.createInstitution(dto, principalOf(request));
  }

  @Get(":id")
  getInstitution(
    @Param("id") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.getInstitution(id, principalOf(request));
  }

  @Patch(":id")
  updateInstitution(
    @Param("id") id: string,
    @Body() dto: UpdateInstitutionDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.updateInstitution(id, dto, principalOf(request));
  }

  @Post(":id/status")
  changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeInstitutionStatusDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.changeInstitutionStatus(id, dto, principalOf(request));
  }

  @Post(":id/archive")
  archive(@Param("id") id: string, @Req() request: AuthorizationAwareRequest) {
    return this.service.archiveInstitution(id, principalOf(request));
  }

  @Get(":id/units")
  units(@Param("id") id: string, @Req() request: AuthorizationAwareRequest) {
    return this.service.listOrgUnits(id, principalOf(request));
  }

  @Post(":id/units")
  createUnit(
    @Param("id") id: string,
    @Body() dto: CreateOrgUnitDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.createOrgUnit(id, dto, principalOf(request));
  }

  @Get(":id/programs")
  programs(@Param("id") id: string, @Req() request: AuthorizationAwareRequest) {
    return this.service.listPrograms(id, principalOf(request));
  }

  @Post(":id/programs")
  createProgramVersion(
    @Param("id") id: string,
    @Body() dto: CreateAcademicProgramDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.createProgramVersion(id, dto, principalOf(request));
  }

  @Get("programs/:programId/versions")
  programVersions(
    @Param("programId") programId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.listProgramVersions(programId, principalOf(request));
  }

  @Post("programs/:programId/check-enrollment")
  checkProgramEnrollment(
    @Param("programId") programId: string,
    @Body() dto: CheckProgramEligibilityDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return {
      eligible: true,
      program: this.service.assertProgramEligible(
        programId,
        dto.enrollmentDate,
        principalOf(request),
      ),
    };
  }
}
