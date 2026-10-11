import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";

import { AuthenticatedOnly } from "../identity/authentication/route-access.decorator";
import type { AuthorizationAwareRequest } from "../identity/authorization/authorization.guard";
import type { AuthorizationPrincipal } from "../identity/authorization/authorization.types";
import {
  AssignSupervisorDto,
  CheckSupervisorEligibilityDto,
  EndSupervisorAssignmentDto,
} from "./assign-supervisor.dto";
import { ThesisEntityService } from "./domain/thesis-entity.service";
import { ThesisSupervisorService } from "./thesis-supervisor.service";

function principalOf(
  request: AuthorizationAwareRequest,
): AuthorizationPrincipal {
  return request.authorizationPrincipal!;
}

@AuthenticatedOnly()
@Controller("thesis")
export class ThesisSupervisorController {
  constructor(
    private readonly service: ThesisSupervisorService,
    private readonly theses: ThesisEntityService,
  ) {}

  @Get(":thesisId/supervisors")
  list(
    @Param("thesisId") thesisId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.listAssignments(thesisId, principalOf(request));
  }

  @Post(":thesisId/supervisors/eligibility")
  eligibility(
    @Param("thesisId") thesisId: string,
    @Body() dto: CheckSupervisorEligibilityDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.checkEligibility(thesisId, dto, principalOf(request));
  }

  @Post(":thesisId/supervisors/assign")
  assign(
    @Param("thesisId") thesisId: string,
    @Body() dto: AssignSupervisorDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    const principal = principalOf(request);

    return this.service.assignSupervisor(
      thesisId,
      dto,
      principal,
      dto.role === "MAIN"
        ? () => {
            this.theses.recordMainSupervisorAssigned(thesisId, principal);
          }
        : undefined,
    );
  }

  @Post(":thesisId/supervisors/:assignmentId/end")
  end(
    @Param("thesisId") thesisId: string,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: EndSupervisorAssignmentDto,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.endAssignment(
      thesisId,
      assignmentId,
      dto,
      principalOf(request),
    );
  }

  @Get(":thesisId/supervision-readiness")
  readiness(
    @Param("thesisId") thesisId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.service.getSupervisionReadiness(thesisId, principalOf(request));
  }
}
