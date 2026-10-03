import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { PersonIdentityService } from "../domain/person-identity.service";
import { IdentityMergeDto } from "@ihepsrs/contracts";

@Controller("research")
export class ResearchersController {
  constructor(private readonly identityService: PersonIdentityService) {}

  @Get("researchers")
  getAllResearchers() {
    return this.identityService.getAllResearchers();
  }

  @Get("researchers/:id")
  getResearcher(@Param("id") id: string) {
    return this.identityService.getResearcher(id);
  }

  @Post("researchers")
  saveResearcher(@Body() body: any) {
    return this.identityService.createOrUpdateResearcher(body);
  }

  @Get("persons")
  getAllPersons() {
    return this.identityService.getAllPersons();
  }

  @Get("persons/match")
  matchPersons(
    @Query("nationalIdentifier") nationalIdentifier?: string,
    @Query("email") email?: string,
    @Query("birthDate") birthDate?: string,
  ) {
    return this.identityService.findMatchingPersons({ nationalIdentifier, email, birthDate });
  }

  @Get("persons/:id")
  getPerson(@Param("id") id: string) {
    return this.identityService.getPerson(id);
  }

  // --- FR-042 & BR-055: Data Steward Person Identity Merge ---
  @Post("identity/merge")
  mergePersonIdentities(@Body() dto: IdentityMergeDto) {
    return this.identityService.mergePersonIdentities(dto);
  }

  @Get("identity/merge-audit")
  getMergeAuditLogs() {
    return this.identityService.getMergeAuditLogs();
  }
}
