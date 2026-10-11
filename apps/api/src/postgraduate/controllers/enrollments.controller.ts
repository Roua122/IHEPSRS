import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";

import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { EnrollmentLifecycleService } from "../domain/enrollment-lifecycle.service";
import {
  EnrollmentPolicyService,
  type ApproveEnrollmentPolicyInput,
} from "../domain/enrollment-policy.service";

/** TASK-PG-005 — operations only; no arbitrary status PUT/PATCH. */
@AuthenticatedOnly()
@Controller("postgraduate/enrollments")
export class EnrollmentsController {
  constructor(
    private readonly lifecycle: EnrollmentLifecycleService,
    private readonly policies: EnrollmentPolicyService,
  ) {}

  @Post("policies/approve")
  approvePolicy(
    @Body() body: ApproveEnrollmentPolicyInput,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.policies.approve(body, request.authorizationPrincipal!);
  }

  @Post()
  create(
    @Body()
    body: { applicationId: string; startDate: string; academicYear: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.create(body, request.authorizationPrincipal!);
  }

  @Get("officer")
  listForOfficer(
    @Query("institutionId") institutionId: string,
    @Query("programId") programId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.listForOfficer(
      institutionId,
      programId,
      request.authorizationPrincipal!,
    );
  }

  @Get(":enrollmentId")
  getOne(
    @Param("enrollmentId") enrollmentId: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.getOne(enrollmentId, request.authorizationPrincipal!);
  }

  @Get(":enrollmentId/status-as-of")
  asOf(
    @Param("enrollmentId") enrollmentId: string,
    @Query("at") at: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.statusAsOf(
      enrollmentId,
      at,
      request.authorizationPrincipal!,
    );
  }

  @Post(":enrollmentId/pending/resolve")
  resolvePending(
    @Param("enrollmentId") id: string,
    @Body() body: { reason: string; approvedProgramReference: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.resolvePending(
      id,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Post(":enrollmentId/suspend")
  suspend(
    @Param("enrollmentId") id: string,
    @Body() body: { reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.suspend(id, body, request.authorizationPrincipal!);
  }

  @Post(":enrollmentId/resume")
  resume(
    @Param("enrollmentId") id: string,
    @Body() body: { reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.resume(id, body, request.authorizationPrincipal!);
  }

  @Post(":enrollmentId/withdraw")
  withdraw(
    @Param("enrollmentId") id: string,
    @Body() body: { reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.withdraw(id, body, request.authorizationPrincipal!);
  }

  @Post(":enrollmentId/cancel")
  cancel(
    @Param("enrollmentId") id: string,
    @Body() body: { reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.cancel(id, body, request.authorizationPrincipal!);
  }

  @Post(":enrollmentId/re-enroll")
  reEnroll(
    @Param("enrollmentId") id: string,
    @Body()
    body: {
      applicationId: string;
      startDate: string;
      academicYear: string;
      reason: string;
    },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.reEnroll(id, body, request.authorizationPrincipal!);
  }

  @Post(":enrollmentId/extend")
  extend(
    @Param("enrollmentId") id: string,
    @Body() body: { months: number; reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.extend(id, body, request.authorizationPrincipal!);
  }

  @Post(":enrollmentId/duration-exception")
  exception(
    @Param("enrollmentId") id: string,
    @Body() body: { months: number; reason: string; evidenceReference: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.approveDurationException(
      id,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Post(":enrollmentId/degree/approve")
  async approveDegree(
    @Param("enrollmentId") id: string,
    @Body() body: { reason: string },
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.approveDegree(
      id,
      body,
      request.authorizationPrincipal!,
    );
  }

  @Get(":enrollmentId/degree-decision")
  getDegree(
    @Param("enrollmentId") id: string,
    @Req() request: AuthorizationAwareRequest,
  ) {
    return this.lifecycle.getDegreeDecision(
      id,
      request.authorizationPrincipal!,
    );
  }
}
