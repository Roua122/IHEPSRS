import { assertUserStatusTransition, type UserStatus } from "./user-status";

export interface UserAccountProps {
  userId: string;
  personId: string;
  username: string;
  status: UserStatus;
  mfaRequired: boolean;
  lastLoginAt?: string;
}

export class UserAccount {
  readonly userId: string;
  readonly personId: string;
  readonly username: string;
  private currentStatus: UserStatus;
  readonly mfaRequired: boolean;
  readonly lastLoginAt?: string;

  constructor(props: UserAccountProps) {
    if (!props.userId.trim()) {
      throw new Error("UserAccount.userId is required");
    }

    if (!props.personId.trim()) {
      throw new Error("UserAccount.personId is required");
    }

    if (!props.username.trim()) {
      throw new Error("UserAccount.username is required");
    }

    this.userId = props.userId;
    this.personId = props.personId;
    this.username = props.username.trim();
    this.currentStatus = props.status;
    this.mfaRequired = props.mfaRequired;
    this.lastLoginAt = props.lastLoginAt;
  }

  get status(): UserStatus {
    return this.currentStatus;
  }

  transitionTo(nextStatus: UserStatus): void {
    assertUserStatusTransition(this.currentStatus, nextStatus);
    this.currentStatus = nextStatus;
  }

  canStartSession(): boolean {
    return this.currentStatus === "Active";
  }

  toSafeSummary() {
    return {
      userId: this.userId,
      personId: this.personId,
      username: this.username,
      status: this.currentStatus,
      mfaRequired: this.mfaRequired,
      lastLoginAt: this.lastLoginAt,
    };
  }
}
