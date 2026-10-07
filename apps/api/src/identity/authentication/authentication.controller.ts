import { Body, Controller, Get, Post, Req } from "@nestjs/common";

import type { AuthorizationAwareRequest } from "../authorization/authorization.guard";
import { AuthenticationService } from "./authentication.service";
import {
  LoginRequestDto,
  ReauthenticationRequestDto,
} from "./authentication.dto";
import { AuthenticatedOnly, PublicRoute } from "./route-access.decorator";
import { SessionService } from "./session.service";

@Controller("auth")
export class AuthenticationController {
  constructor(
    private readonly authentication: AuthenticationService,
    private readonly sessions: SessionService,
  ) {}

  @PublicRoute()
  @Post("login")
  login(@Body() body: LoginRequestDto) {
    return this.authentication.login(body);
  }

  @AuthenticatedOnly()
  @Get("session")
  session(@Req() request: AuthorizationAwareRequest) {
    const sessionId = request.authenticationSession?.sessionId;
    return sessionId ? this.sessions.describe(sessionId) : null;
  }

  @AuthenticatedOnly()
  @Post("reauthenticate")
  reauthenticate(
    @Req() request: AuthorizationAwareRequest,
    @Body() body: ReauthenticationRequestDto,
  ) {
    const session = request.authenticationSession;
    if (!session) {
      return { reauthenticated: false };
    }

    this.authentication.reauthenticate(session.sessionId, session.userId, body);
    return { reauthenticated: true };
  }

  @AuthenticatedOnly()
  @Post("logout")
  logout(@Req() request: AuthorizationAwareRequest) {
    const sessionId = request.authenticationSession?.sessionId;
    if (sessionId) {
      this.authentication.logout(sessionId);
    }
    return { loggedOut: true };
  }
}
