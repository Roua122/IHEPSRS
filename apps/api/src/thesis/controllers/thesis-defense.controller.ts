import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { AuthenticatedOnly } from "../../identity/authentication/route-access.decorator";
import type { AuthorizationAwareRequest } from "../../identity/authorization/authorization.guard";
import { ThesisDefenseService } from "../domain/thesis-defense.service";
import type {
  DefenseCommitteeMember,
  DefenseOutcome,
} from "../domain/thesis-defense.types";

/** TH005–TH008: explicit transitions; no arbitrary PATCH/status/decision actor. */
@AuthenticatedOnly()
@Controller("theses/:thesisId/defense")
export class ThesisDefenseController {
  constructor(private readonly defense: ThesisDefenseService) {}

  @Post("committee-member-attestations")
  attestMember(
    @Param("thesisId") id: string,
    @Body()
    body: {
      member: DefenseCommitteeMember;
      conflictDeclared: boolean;
      reason: string;
    },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.attestMember(id, body, req.authorizationPrincipal!);
  }

  @Post("committees")
  propose(
    @Param("thesisId") id: string,
    @Body() body: { members: DefenseCommitteeMember[]; reason: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.proposeCommittee(id, body, req.authorizationPrincipal!);
  }
  @Post("committees/:committeeId/approve")
  approveCommittee(
    @Param("thesisId") id: string,
    @Param("committeeId") committeeId: string,
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.approveCommittee(
      id,
      committeeId,
      req.authorizationPrincipal!,
    );
  }
  @Get("committees")
  committees(
    @Param("thesisId") id: string,
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.listCommittees(id, req.authorizationPrincipal!);
  }
  @Post("sessions")
  schedule(
    @Param("thesisId") id: string,
    @Body() body: { committeeId: string; scheduledAt: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.schedule(id, body, req.authorizationPrincipal!);
  }
  @Get("sessions")
  sessions(
    @Param("thesisId") id: string,
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.listSessions(id, req.authorizationPrincipal!);
  }
  @Post("sessions/:sessionId/minutes")
  minutes(
    @Param("thesisId") id: string,
    @Param("sessionId") sessionId: string,
    @Body() body: { heldAt: string; minutes: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.recordMinutes(
      id,
      sessionId,
      body,
      req.authorizationPrincipal!,
    );
  }
  @Post("sessions/:sessionId/outcome")
  outcome(
    @Param("thesisId") id: string,
    @Param("sessionId") sessionId: string,
    @Body()
    body: { outcome: DefenseOutcome; reason: string; corrections?: string[] },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.decideOutcome(
      id,
      sessionId,
      body,
      req.authorizationPrincipal!,
    );
  }
  @Post("exceptions/additional-defense")
  extraDefense(
    @Param("thesisId") id: string,
    @Body() body: { reason: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.approveExtraDefense(
      id,
      body?.reason,
      req.authorizationPrincipal!,
    );
  }
  @Get("corrections")
  corrections(
    @Param("thesisId") id: string,
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.listCorrections(id, req.authorizationPrincipal!);
  }
  @Post("corrections/:correctionId/submit")
  submitCorrection(
    @Param("thesisId") id: string,
    @Param("correctionId") correctionId: string,
    @Body() body: { evidenceNote: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.submitCorrection(
      id,
      correctionId,
      body,
      req.authorizationPrincipal!,
    );
  }
  @Post("corrections/:correctionId/verify")
  verifyCorrection(
    @Param("thesisId") id: string,
    @Param("correctionId") correctionId: string,
    @Body() body: { approved: boolean; reason: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.verifyCorrection(
      id,
      correctionId,
      body,
      req.authorizationPrincipal!,
    );
  }
  @Post("approve")
  finalApprove(
    @Param("thesisId") id: string,
    @Body() body: { reason: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.approveThesis(
      id,
      body?.reason,
      req.authorizationPrincipal!,
    );
  }
  @Post("archive")
  archive(
    @Param("thesisId") id: string,
    @Body() body: { reason: string },
    @Req() req: AuthorizationAwareRequest,
  ) {
    return this.defense.archive(id, body?.reason, req.authorizationPrincipal!);
  }
}
