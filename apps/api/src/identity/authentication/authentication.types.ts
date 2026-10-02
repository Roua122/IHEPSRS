import type { AuthorizationPrincipal } from "../authorization/authorization.types";

export type SessionSecurityProfile = "SENSITIVE" | "REGULAR";

export interface AuthenticationSessionContext {
  sessionId: string;
  userId: string;
  profile: SessionSecurityProfile;
}

export interface AuthenticatedSession {
  sessionId: string;
  principal: AuthorizationPrincipal;
  profile: SessionSecurityProfile;
  idleTimeoutMinutes: number;
  maxSessionHours: number;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  mfaVerifiedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaCode: string;
}

export interface ReauthenticationRequest {
  password: string;
  mfaCode: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  session: AuthenticatedSession;
}
