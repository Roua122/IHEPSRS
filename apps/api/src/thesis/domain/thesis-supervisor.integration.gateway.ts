import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import type { AuthorizationPrincipal } from "../../identity/authorization/authorization.types";
import { EnrollmentLifecycleService } from "../../postgraduate/domain/enrollment-lifecycle.service";
import { ThesisSupervisionContextService } from "../thesis-supervision-context.service";
import { ThesisSupervisorService } from "../thesis-supervisor.service";
import {
  type ActiveMainSupervisorEvidence,
  ThesisSupervisorGateway,
} from "./thesis-supervisor.gateway";

@Injectable()
export class IntegratedThesisSupervisorGateway extends ThesisSupervisorGateway {
  constructor(
    private readonly supervisors: ThesisSupervisorService,
    private readonly contexts: ThesisSupervisionContextService,
    private readonly enrollments: EnrollmentLifecycleService,
  ) {
    super();
  }

  async assertActiveMainSupervisor(
    thesisId: string,
    enrollmentId: string,
  ): Promise<ActiveMainSupervisorEvidence> {
    const assignment =
      this.supervisors.getActiveMainAssignmentForIntegration(thesisId);

    return this.verifyEvidence(thesisId, enrollmentId, assignment.assignmentId);
  }

  async assertAssignedMainSupervisor(
    thesisId: string,
    enrollmentId: string,
    principal: AuthorizationPrincipal,
  ): Promise<ActiveMainSupervisorEvidence> {
    const assignment =
      this.supervisors.assertAssignedMainSupervisorForIntegration(
        thesisId,
        principal,
      );

    return this.verifyEvidence(thesisId, enrollmentId, assignment.assignmentId);
  }

  private verifyEvidence(
    thesisId: string,
    enrollmentId: string,
    assignmentId: string,
  ): ActiveMainSupervisorEvidence {
    const context = this.contexts.get(thesisId);
    const enrollment = this.enrollments.getForIntegration(enrollmentId);

    if (
      enrollment.status !== "Active" ||
      enrollment.institutionId !== context.institutionId ||
      enrollment.programId !== context.programId ||
      enrollment.personId !== context.studentPersonId
    ) {
      throw new AppException({
        code: ErrorCode.Conflict,
        status: HttpStatus.CONFLICT,
        message:
          "BR-011: Main Supervisor evidence does not match an Active Thesis enrollment",
      });
    }

    return {
      thesisId,
      enrollmentId,
      assignmentId,
    };
  }
}
