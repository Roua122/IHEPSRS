import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AuthorizationPrincipal } from "../authorization/authorization.types";
import { UserAccount } from "../domain/user-account";
import { assertKnownRoleCode, isKnownRoleCode } from "../domain/role-catalogue";
import type { UserStatus } from "../domain/user-status";
import type { SessionSecurityProfile } from "./authentication.types";

export const PROTOTYPE_LOCAL_IDENTITY_OPTIONS = Symbol(
  "PROTOTYPE_LOCAL_IDENTITY_OPTIONS",
);

export interface PrototypeLocalIdentityOptions {
  enabled: boolean;
  trustedSsoAvailable: boolean;
  username: string;
  password: string;
  totpSecret: string;
  userId: string;
  personId: string;
  roleCode: string;
  institutionId?: string | null;
  sessionProfile: SessionSecurityProfile;
  status?: UserStatus;
}

export interface PrototypeLocalIdentityRecord {
  account: UserAccount;
  configuredPassword: string;
  totpSecret: string;
  sessionProfile: SessionSecurityProfile;
  principal: AuthorizationPrincipal;
}

function envBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

@Injectable()
export class PrototypeLocalIdentityService {
  private readonly options: PrototypeLocalIdentityOptions;

  constructor(
    @Optional() private readonly config?: ConfigService,
    @Optional()
    @Inject(PROTOTYPE_LOCAL_IDENTITY_OPTIONS)
    override?: PrototypeLocalIdentityOptions,
  ) {
    this.options = override ?? this.readFromEnvironment();
  }

  isLocalFallbackAvailable(): boolean {
    return (
      this.options.enabled &&
      !this.options.trustedSsoAvailable &&
      Boolean(
        this.options.username &&
        this.options.password &&
        this.options.totpSecret &&
        this.options.userId &&
        this.options.personId,
      ) &&
      isKnownRoleCode(this.options.roleCode)
    );
  }

  getByUsername(username: string): PrototypeLocalIdentityRecord | null {
    if (!this.isLocalFallbackAvailable()) {
      return null;
    }

    if (username.trim().toLowerCase() !== this.options.username.toLowerCase()) {
      return null;
    }

    return this.buildRecord();
  }

  getByUserId(userId: string): PrototypeLocalIdentityRecord | null {
    if (!this.isLocalFallbackAvailable() || userId !== this.options.userId) {
      return null;
    }
    return this.buildRecord();
  }

  private buildRecord(): PrototypeLocalIdentityRecord {
    assertKnownRoleCode(this.options.roleCode);

    const now = new Date().toISOString();
    const account = new UserAccount({
      userId: this.options.userId,
      personId: this.options.personId,
      username: this.options.username,
      status: this.options.status ?? "Active",
      mfaRequired: true,
    });

    return {
      account,
      configuredPassword: this.options.password,
      totpSecret: this.options.totpSecret,
      sessionProfile: this.options.sessionProfile,
      principal: {
        userId: this.options.userId,
        authenticated: true,
        roleAssignments: [
          {
            assignmentId: `prototype:${this.options.userId}:${this.options.roleCode}`,
            roleCode: this.options.roleCode,
            institutionId: this.options.institutionId?.trim() || null,
            validFrom: now,
            validTo: null,
          },
        ],
      },
    };
  }

  private readFromEnvironment(): PrototypeLocalIdentityOptions {
    const get = (key: string) => this.config?.get<string>(key)?.trim() ?? "";
    const profileRaw = get("PROTOTYPE_AUTH_SESSION_PROFILE");

    return {
      enabled: envBoolean(
        this.config?.get("PROTOTYPE_LOCAL_AUTH_ENABLED"),
        false,
      ),
      trustedSsoAvailable: envBoolean(
        this.config?.get("TRUSTED_SSO_AVAILABLE"),
        false,
      ),
      username: get("PROTOTYPE_AUTH_USERNAME"),
      password: get("PROTOTYPE_AUTH_PASSWORD"),
      totpSecret: get("PROTOTYPE_AUTH_TOTP_SECRET"),
      userId: get("PROTOTYPE_AUTH_USER_ID"),
      personId: get("PROTOTYPE_AUTH_PERSON_ID"),
      roleCode: get("PROTOTYPE_AUTH_ROLE_CODE"),
      institutionId: get("PROTOTYPE_AUTH_INSTITUTION_ID") || null,
      sessionProfile: profileRaw === "REGULAR" ? "REGULAR" : "SENSITIVE",
    };
  }
}
